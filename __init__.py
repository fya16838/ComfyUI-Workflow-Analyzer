"""
ComfyUI-Workflow-Analyzer
A floating-button + right-click workflow analyzer: drag/analyze workflow JSON,
see all custom nodes with GitHub URLs, install via ComfyUI-Manager.

Inspired by the workflow parsing feature at comfyai.run
"""
import json
import os
import asyncio
from datetime import datetime
from pathlib import Path

WEB_DIRECTORY = "js"

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

# ── Core ComfyUI repos to exclude from results ──
_CORE_REPOS = {
    "https://github.com/comfyanonymous/ComfyUI",
    "https://github.com/Comfy-Org/ComfyUI",
}

# ── Build reverse lookup from ComfyUI-Manager's node DB ──
_NODE_MAP_PATH = Path(__file__).parent.parent / "ComfyUI-Manager" / "extension-node-map.json"
_CLASS_TYPE_TO_URL = {}  # class_type -> [github_url, ...]

def _build_lookup():
    if _NODE_MAP_PATH.exists():
        try:
            with open(_NODE_MAP_PATH, 'r', encoding='utf-8') as f:
                ext_map = json.load(f)
            for github_url, node_groups in ext_map.items():
                for group in node_groups:
                    for node_type in group:
                        _CLASS_TYPE_TO_URL.setdefault(node_type, []).append(github_url)
        except Exception as e:
            print(f"[WF Analyzer] Failed to load node map: {e}")

_build_lookup()


# ── Settings file ──
_SETTINGS_FILE = Path(__file__).parent / "settings.json"
_DEFAULT_SETTINGS = {"proxy": "", "lang": "zh", "search_engine": "bing"}

def _load_settings():
    if _SETTINGS_FILE.exists():
        try:
            with open(_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {**_DEFAULT_SETTINGS, **data}
        except:
            return dict(_DEFAULT_SETTINGS)
    return dict(_DEFAULT_SETTINGS)

def _save_settings(settings):
    _SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    current = _load_settings()
    current.update(settings)
    with open(_SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

def _get_proxy():
    return _load_settings().get("proxy", "")

def _get_connector(proxy_url=None):
    """Create a TCPConnector optionally using SOCKS5 proxy."""
    if not proxy_url:
        proxy_url = _get_proxy()
    if proxy_url and proxy_url.strip():
        parts = proxy_url.strip().replace("socks5://", "").split(":")
        host = parts[0]
        port = int(parts[1]) if len(parts) > 1 else 10808
        try:
            from aiohttp_socks import ProxyConnector, ProxyType
            return ProxyConnector(host=host, port=port, proxy_type=ProxyType.SOCKS5)
        except ImportError:
            print("[WF Analyzer] aiohttp_socks not installed, using direct connection")
    return None


# ── API Routes ──
try:
    from server import PromptServer
    from aiohttp import web
    import aiohttp

    def _server_url(path=""):
        """Build URL pointing to this ComfyUI server — never hardcode 127.0.0.1."""
        addr = getattr(PromptServer.instance, "address", "127.0.0.1")
        if addr == "0.0.0.0":
            addr = "127.0.0.1"
        return f"http://{addr}:{PromptServer.instance.port}{path}"

    routes = PromptServer.instance.routes

    _LANG_DIR = Path(__file__).parent / "Language"

    @routes.get("/wf-analyzer/languages")
    async def list_languages(request):
        """List available language packs."""
        langs = []
        if _LANG_DIR.exists():
            for f in sorted(_LANG_DIR.iterdir()):
                if f.suffix == ".json":
                    langs.append(f.stem)
        return web.json_response(langs)

    @routes.get("/wf-analyzer/lang/{lang}")
    async def get_language(request):
        """Get a specific language pack."""
        lang = request.match_info.get("lang", "en")
        lang_file = _LANG_DIR / f"{lang}.json"
        if lang_file.exists():
            try:
                with open(lang_file, 'r', encoding='utf-8') as f:
                    return web.json_response(json.load(f))
            except Exception as e:
                return web.json_response({"error": str(e)}, status=500)
        return web.json_response({"error": f"Language '{lang}' not found"}, status=404)

    @routes.get("/wf-analyzer/node-map")
    async def get_node_map(request):
        """Return class_type -> [github_urls] for frontend use."""
        return web.json_response(_CLASS_TYPE_TO_URL)

    @routes.get("/wf-analyzer/installed-repos")
    async def get_installed_repos(request):
        """
        Return a set of repo names that are currently installed,
        fetched from ComfyUI-Manager's /customnode/installed endpoint.
        Returns: {"installed": ["RepoName1", "RepoName2", ...]}
        """
        try:
            cm_url = _server_url("/customnode/installed")
            conn = _get_connector()
            async with aiohttp.ClientSession(connector=conn) as session:
                async with session.get(cm_url) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        # data keys are repo names
                        installed = list(data.keys())
                    else:
                        installed = []
            return web.json_response({"installed": installed})
        except Exception as e:
            return web.json_response({"installed": [], "error": str(e)})

    @routes.post("/wf-analyzer/analyze")
    async def analyze_workflow(request):
        """Analyze a workflow JSON and return custom node info."""
        try:
            body = await request.json()
            wf = body.get("workflow", {})
            if isinstance(wf, str):
                wf = json.loads(wf)

            class_types = _collect_class_types(wf)
            builtin_set = _BUILTIN_NODES()
            builtin_count = 0
            custom_nodes = {}   # url -> info
            unknown_nodes = []

            for ct in sorted(class_types):
                urls = _CLASS_TYPE_TO_URL.get(ct, [])
                if ct in builtin_set:
                    builtin_count += 1
                elif urls:
                    for url in urls:
                        if url in _CORE_REPOS:
                            builtin_count += 1
                        elif url not in custom_nodes:
                            repo_name = url.rstrip('/').split('/')[-1]
                            custom_nodes[url] = {
                                "github_url": url,
                                "repo_name": repo_name,
                                "class_types": [],
                            }
                            custom_nodes[url]["class_types"].append(ct)
                        else:
                            custom_nodes[url]["class_types"].append(ct)
                else:
                    unknown_nodes.append(ct)

            return web.json_response({
                "total_nodes": len(class_types),
                "builtin_count": builtin_count,
                "custom_nodes": list(custom_nodes.values()),
                "unknown_nodes": unknown_nodes,
            })
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    @routes.get("/wf-analyzer/settings")
    async def get_settings(request):
        """Return all settings."""
        return web.json_response(_load_settings())

    @routes.post("/wf-analyzer/settings")
    async def set_settings(request):
        """Save settings. Body: {"proxy": "...", ...}"""
        try:
            body = await request.json()
            _save_settings(body)
            return web.json_response({"status": "ok", "settings": _load_settings()})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    # ── Model Analysis (uses ComfyUI folder_paths) ──
    _NODE_MODEL_KEYS = {
        "CheckpointLoaderSimple": (["ckpt_name"], "checkpoints"),
        "CheckpointLoader": (["ckpt_name"], "checkpoints"),
        "VAELoader": (["vae_name"], "vae"),
        "VAEDecode": ([], None),
        "VAEEncode": ([], None),
        "LoraLoader": (["lora_name"], "loras"),
        "LoraLoaderModelOnly": (["lora_name"], "loras"),
        "ControlNetLoader": (["control_net_name"], "controlnet"),
        "DiffControlNetLoader": (["control_net_name"], "controlnet"),
        "CLIPLoader": (["clip_name"], "text_encoders"),
        "DualCLIPLoader": (["clip_name1", "clip_name2"], "text_encoders"),
        "UNETLoader": (["unet_name"], "diffusion_models"),
        "UpscaleModelLoader": (["model_name"], "upscale_models"),
        "StyleModelLoader": (["model_name"], "style_models"),
        "GLIGENLoader": (["gligen_name"], "gligen"),
        "HypernetworkLoader": (["model_name"], "hypernetworks"),
        "CLIPVisionLoader": (["clip_name", "clip_vision_name"], "clip_vision"),
        "ImageOnlyCheckpointLoader": (["ckpt_name"], "checkpoints"),
        "unCLIPCheckpointLoader": (["ckpt_name"], "checkpoints"),
        "IPAdapterUnifiedLoader": (["model_name"], "ipadapter"),
        "IPAdapterUnifiedLoaderFaceID": (["model_name"], "ipadapter"),
    }

    _MODEL_CATEGORIES = sorted(set(v[1] for v in _NODE_MODEL_KEYS.values() if v[1] is not None))

    def _find_model_by_folder_type(folder_type, search_name):
        """Search for a model using cached model file lists."""
        cache = _load_models_cache()
        today = datetime.now().strftime("%Y-%m-%d")
        all_files = cache.get("categories", {}).get(folder_type, [])
        # Normalize backslashes to forward slashes
        all_files = [f.replace("\\", "/") for f in all_files]
        # If cache missing or stale, fetch via list-models API
        if not all_files or cache.get("date") != today:
            try:
                port = PromptServer.instance.port
                url = _server_url(f"/wf-analyzer/list-models?category={folder_type}")
                import aiohttp
                # Use a new event loop for sync context
                loop = asyncio.new_event_loop()
                async def _fetch():
                    async with aiohttp.ClientSession() as sess:
                        async with sess.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                            if resp.status == 200:
                                d = await resp.json()
                                return d.get("models", [])
                            return []
                all_files = loop.run_until_complete(_fetch())
                loop.close()
            except Exception:
                pass
        if not all_files:
            return []
        search_lower = search_name.lower().replace("\\", "/").split("/")[-1]
        name_no_ext, _ = os.path.splitext(search_lower)
        matches = []
        for f in all_files:
            f_lower = f.lower()
            f_no_ext, _ = os.path.splitext(f_lower)
            if f_no_ext == name_no_ext or f_lower == search_lower:
                matches.append((f, 100))
            elif name_no_ext in f_no_ext:
                matches.append((f, 70))
        matches.sort(key=lambda x: (-x[1], len(x[0])))
        return [{"path": m[0], "score": m[1]} for m in matches]

    @routes.post("/wf-analyzer/analyze-models")
    async def analyze_models(request):
        """
        Analyze a workflow JSON and match all referenced models to local model files.
        Body: {"workflow": {...}}
        Returns model references with matched local paths.
        """
        try:
            body = await request.json()
            wf = body.get("workflow", {})
            if isinstance(wf, str):
                wf = json.loads(wf)

            # Collect all node definitions from both API format and standard format
            node_defs = {}  # node_id -> {class_type, inputs}
            if isinstance(wf, dict):
                for key, value in wf.items():
                    if isinstance(value, dict) and "class_type" in value:
                        node_defs[key] = {
                            "class_type": value.get("class_type", ""),
                            "inputs": value.get("inputs", {}),
                        }
                nodes = wf.get("nodes")
                if isinstance(nodes, list):
                    for node in nodes:
                        if isinstance(node, dict):
                            nid = node.get("id", "")
                            node_defs[str(nid)] = {
                                "class_type": node.get("type", ""),
                                "inputs": node.get("widgets_values", {}) if isinstance(node.get("widgets_values"), dict) else {},
                            }

            results = []
            for node_id, ndef in node_defs.items():
                ct = ndef.get("class_type", "")
                inputs = ndef.get("inputs", {})
                info = _NODE_MODEL_KEYS.get(ct)
                if not info:
                    continue
                keys, category = info
                if not keys:
                    continue
                for key in keys:
                    model_val = inputs.get(key, "")
                    if not model_val or not isinstance(model_val, str):
                        continue
                    model_name = model_val.strip()
                    if not model_name:
                        continue
                    entry = {
                        "node_id": node_id,
                        "class_type": ct,
                        "model_key": key,
                        "requested_name": model_name,
                        "category": category,
                        "matches": [],
                    }
                    if category:
                        found = _find_model_by_folder_type(category, model_name)
                        if found:
                            entry["matches"].extend(found)
                    results.append(entry)

            return web.json_response({"models": results, "total": len(results)})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    _CACHE_DIR = Path(__file__).parent / "cache"
    _CACHE_FILE = _CACHE_DIR / "versions.json"
    _MODELS_CACHE_FILE = _CACHE_DIR / "models_cache.json"

    def _load_models_cache():
        if _MODELS_CACHE_FILE.exists():
            try:
                with open(_MODELS_CACHE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {"date": "", "categories": {}}

    def _save_models_cache(data):
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(_MODELS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @routes.get("/wf-analyzer/list-models")
    async def list_models_by_category(request):
        """
        List all model files in a specific ComfyUI model category.
        Query param: category, refresh=true to force re-scan.
        Uses cache/models_cache.json to avoid repeated API calls.
        """
        category = request.query.get("category", "").strip()
        refresh = request.query.get("refresh", "").lower() == "true"
        if not category:
            return web.json_response({"category": category, "models": []})
        
        cache = _load_models_cache()
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Return cached data if available and not forced refresh
        if not refresh and cache.get("date") == today and category in cache.get("categories", {}):
            cached_files = [f.replace("\\", "/") for f in cache["categories"][category]]
            return web.json_response({"category": category, "models": cached_files})
        
        try:
            port = PromptServer.instance.port
            url = _server_url(f"/models/{category}")
            async with aiohttp.ClientSession() as sess:
                async with sess.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status == 200:
                        files = await resp.json()
                        files = [f.replace("\\", "/") for f in files]
                        files = sorted(files, key=lambda x: (os.path.dirname(x).lower(), x.lower()))
                        # Update cache
                        if cache.get("date") != today:
                            cache = {"date": today, "categories": {}}
                        cache["categories"][category] = files
                        _save_models_cache(cache)
                        return web.json_response({"category": category, "models": files})
            return web.json_response({"category": category, "models": []})
        except Exception:
            # Fallback to cache even on error
            if category in cache.get("categories", {}):
                return web.json_response({"category": category, "models": cache["categories"][category]})
            return web.json_response({"category": category, "models": []})

    @routes.post("/wf-analyzer/refresh-models")
    async def refresh_all_models(request):
        """
        Force re-scan all model categories via ComfyUI's /models API and update cache.
        Body: {} (optional: {"categories": ["checkpoints", "loras", ...]} for selective refresh)
        Returns: {"status": "ok", "categories": N, "total_files": N}
        """
        try:
            body = await request.json() if request.can_read_body else {}
        except Exception:
            body = {}
        selected = body.get("categories", None)
        port = PromptServer.instance.port
        today = datetime.now().strftime("%Y-%m-%d")
        cache = {"date": today, "categories": {}}
        total_files = 0
        categories_scanned = 0
        try:
            async with aiohttp.ClientSession() as sess:
                cats_to_scan = [c for c in _MODEL_CATEGORIES if not selected or c in selected]
                for cat in cats_to_scan:
                    try:
                        async with sess.get(_server_url(f"/models/{cat}"), timeout=aiohttp.ClientTimeout(total=60)) as r:
                            if r.status == 200:
                                files = await r.json()
                                files = [f.replace("\\", "/") for f in files]
                                files = sorted(files, key=lambda x: (os.path.dirname(x).lower(), x.lower()))
                                cache["categories"][cat] = files
                                total_files += len(files)
                                categories_scanned += 1
                    except Exception:
                        cache["categories"][cat] = []
                        categories_scanned += 1
            _save_models_cache(cache)
            return web.json_response({
                "status": "ok", "categories": categories_scanned, "total_files": total_files, "date": today
            })
        except Exception as e:
            return web.json_response({"status": "error", "message": str(e)}, status=500)

    @routes.get("/wf-analyzer/cache/versions")
    async def get_version_cache(request):
        """Read version cache from cache/versions.json"""
        if _CACHE_FILE.exists():
            try:
                with open(_CACHE_FILE, 'r', encoding='utf-8') as f:
                    return web.json_response(json.load(f))
            except:
                pass
        return web.json_response({"date": "", "versions": {}})

    @routes.post("/wf-analyzer/cache/versions")
    async def set_version_cache(request):
        """Write version cache to cache/versions.json"""
        try:
            body = await request.json()
            _CACHE_DIR.mkdir(parents=True, exist_ok=True)
            with open(_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(body, f, indent=2, ensure_ascii=False)
            return web.json_response({"status": "ok"})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    _UNKNOWN_CACHE_FILE = _CACHE_DIR / "unknown_cache.json"

    @routes.get("/wf-analyzer/cache/unknown")
    async def get_unknown_cache(request):
        """Read unknown node search cache."""
        if _UNKNOWN_CACHE_FILE.exists():
            try:
                with open(_UNKNOWN_CACHE_FILE, 'r', encoding='utf-8') as f:
                    return web.json_response(json.load(f))
            except:
                pass
        return web.json_response({})

    @routes.post("/wf-analyzer/cache/unknown")
    async def set_unknown_cache(request):
        """Write unknown node search cache."""
        try:
            body = await request.json()
            _CACHE_DIR.mkdir(parents=True, exist_ok=True)
            with open(_UNKNOWN_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(body, f, indent=2, ensure_ascii=False)
            return web.json_response({"status": "ok"})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    @routes.post("/wf-analyzer/search-node")
    async def search_node(request):
        """
        Search for a node class_type on GitHub to find its repository.
        Body: {"class_type": "NodeName"}
        Returns: {"results": [{"repo_name": "...", "github_url": "..."}], "class_type": "..."}
        """
        try:
            body = await request.json()
            class_type = body.get("class_type", "")
            if not class_type:
                return web.json_response({"results": [], "class_type": class_type})

            results = []
            # Search GitHub for repositories with this node type
            query = f"{class_type} ComfyUI node in:name,description,topics"
            search_url = f"https://api.github.com/search/repositories?q={query}&per_page=5&sort=stars&order=desc"

            conn = _get_connector()
            async with aiohttp.ClientSession(connector=conn) as session:
                async with session.get(search_url, timeout=aiohttp.ClientTimeout(total=20),
                                        headers={"Accept": "application/vnd.github.v3+json",
                                                 "User-Agent": "ComfyUI-Workflow-Analyzer/1.0"}) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("items", []):
                            repo_name = item.get("full_name", "")
                            html_url = item.get("html_url", "")
                            if html_url and html_url not in _CORE_REPOS:
                                results.append({
                                    "repo_name": repo_name.split("/")[-1] if "/" in repo_name else repo_name,
                                    "github_url": html_url,
                                })
                    elif resp.status == 403:
                        # Rate limited, return empty
                        pass

            return web.json_response({"results": results, "class_type": class_type})
        except Exception as e:
            return web.json_response({"results": [], "class_type": class_type, "error": str(e)})

    @routes.post("/wf-analyzer/node-versions")
    async def node_versions(request):
        """
        Fetch available versions for a GitHub repo.
        Body: {"github_url": "https://github.com/user/repo"}
        Returns: {"versions": ["latest", "v1.0", ...], "repo_name": "repo"}

        Combines two sources:
        1. ComfyUI-Manager's /customnode/versions/{repo_name} (CNR registry — most complete)
        2. GitHub Tags API (fallback)
        """
        try:
            body = await request.json()
            url = body.get("github_url", "")
            parts = url.rstrip('/').split('/')
            if len(parts) < 2:
                return web.json_response({"versions": ["latest"], "repo_name": parts[-1] if parts else "unknown"})
            owner = parts[-2]
            repo_name = parts[-1]
            all_versions = {"latest"}  # use set to deduplicate

            # Source 1: ComfyUI-Manager CNR versions
            try:
                cm_url = _server_url(f"/customnode/versions/{repo_name}")
                async with aiohttp.ClientSession() as session:
                    async with session.get(cm_url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            for entry in data:
                                v = entry.get("version", "") if isinstance(entry, dict) else str(entry)
                                if v:
                                    all_versions.add(v)
            except Exception:
                pass

            # Source 2: GitHub Tags API (may need proxy for restricted networks)
            try:
                tags_url = f"https://api.github.com/repos/{owner}/{repo_name}/tags?per_page=100"
                conn = _get_connector()
                async with aiohttp.ClientSession(connector=conn) as session:
                    async with session.get(tags_url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        if resp.status == 200:
                            tags = await resp.json()
                            for t in tags:
                                name = t.get("name", "")
                                if name:
                                    all_versions.add(name)
            except Exception:
                pass

            # Sort: "latest" first, then newest first (reverse)
            sorted_versions = sorted(all_versions, key=lambda v: (0 if v == "latest" else 1, v), reverse=True)
            # But "latest" must stay first, so re-sort
            latest = [v for v in sorted_versions if v == "latest"]
            rest = [v for v in sorted_versions if v != "latest"]
            sorted_versions = latest + rest
            return web.json_response({"versions": sorted_versions, "repo_name": repo_name})

        except Exception as e:
            return web.json_response({"versions": ["latest"], "repo_name": "unknown"})

    @routes.post("/wf-analyzer/install-nodes")
    async def install_nodes(request):
        """
        Install custom nodes via git clone, with optional version selection.
        Body: {"urls": [{"url": "https://github.com/...", "version": "v1.0"}], ...}
        or:    {"urls": ["https://github.com/..."], ...}  (backward compat)
        Always uses git clone directly (no ComfyUI-Manager dependency).
        For "latest", clones the default branch. For specific versions, uses --branch.
        """
        try:
            body = await request.json()
            items = body.get("urls", [])
            results = []

            for item in items:
                # Support both string URL and {url, version} object
                if isinstance(item, str):
                    url = item
                    version = "latest"
                else:
                    url = item.get("url", "")
                    version = item.get("version", "latest")

                try:
                    repo_name = url.rstrip('/').split('/')[-1]
                    custom_nodes_dir = Path(__file__).parent.parent
                    target_dir = custom_nodes_dir / repo_name

                    import subprocess
                    import shutil

                    # Remove existing directory if reinstalling
                    if target_dir.exists():
                        shutil.rmtree(target_dir)

                    if version and version != "latest":
                        # Clone with specific version
                        proc = await asyncio.create_subprocess_exec(
                            "git", "clone", "--branch", version, "--depth", "1",
                            url, str(target_dir),
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE,
                        )
                    else:
                        # Clone default branch (latest)
                        proc = await asyncio.create_subprocess_exec(
                            "git", "clone", "--depth", "1",
                            url, str(target_dir),
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE,
                        )
                    stdout, stderr = await proc.communicate()

                    if proc.returncode == 0:
                        results.append({"url": url, "version": version, "status": 200, "message": "OK"})
                    else:
                        err_msg = stderr.decode().strip() if stderr else "git clone failed"
                        results.append({"url": url, "version": version, "status": 500, "message": err_msg})

                except Exception as e:
                    results.append({"url": url, "version": version, "status": 500, "message": str(e)})

            return web.json_response({"results": results})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

except ImportError:
    print("[WF Analyzer] PromptServer not available; API routes not registered.")


# ── Helpers ──

def _BUILTIN_NODES():
    return {
        "KSampler", "KSamplerAdvanced", "CheckpointLoaderSimple",
        "CLIPTextEncode", "CLIPSetLastLayer", "CLIPVisionEncode",
        "VAEDecode", "VAEEncode", "VAEEncodeForInpaint",
        "LoadImage", "SaveImage", "PreviewImage", "LoadLatent", "SaveLatent",
        "EmptyLatentImage", "LatentUpscale", "LatentUpscaleBy",
        "LatentRotate", "LatentFlip", "LatentComposite",
        "LatentBlend", "LatentCrop",
        "UpscaleModelLoader", "ImageUpscaleWithModel",
        "ImageScale", "ImageScaleToTotalPixels", "ImageCrop",
        "ImageInvert", "ImagePadForOutpaint",
        "ImageResize", "ImageFlip", "ImageRotate",
        "ImageBlend", "ImageComposite",
        "LoraLoader", "LoraLoaderModelOnly",
        "ControlNetLoader", "ControlNetApply", "ControlNetApplyAdvanced",
        "DiffControlNetLoader",
        "CLIPLoader", "DualCLIPLoader", "UNETLoader",
        "VAELoader", "HypernetworkLoader",
        "GLIGENLoader", "StyleModelLoader",
        "CLIPVisionLoader", "IPAdapterApply",
        "Reroute", "Note", "PrimitiveNode",
        "ConditioningCombine", "ConditioningAverage", "ConditioningSetArea",
        "ConditioningSetMask", "ConditioningZeroOut",
        "ConditioningSetTimestepRange",
        "ModelMergeSimple", "ModelMergeSubtract",
        "ModelMergeAdd", "ModelMergeMultiply",
        "VAEDecodeTiled", "VAEEncodeTiled",
        "ImageBatch", "LatentBatch",
        "CheckpointLoader", "FluxGuidance", "DualCFGGuider",
        "EmptySD3LatentImage", "EmptyMochiLatentImage",
        "LoadVideo", "SaveVideo",
        "unCLIPCheckpointLoader",
        "GLIGENTextBoxApply",
        "InstructPixToPixConditioning",
        "PixelKSampleUpscalerProvider",
    }


def _collect_class_types(workflow_data):
    """Extract all unique class_type values from any workflow JSON format."""
    class_types = set()
    if isinstance(workflow_data, dict):
        # API format: check all top-level keys for class_type
        for key, value in workflow_data.items():
            if isinstance(value, dict):
                ct = value.get("class_type")
                if ct and isinstance(ct, str):
                    class_types.add(ct)
        # Standard format: check nodes array for type
        nodes = workflow_data.get("nodes")
        if isinstance(nodes, list):
            for node in nodes:
                if isinstance(node, dict):
                    ct = node.get("type")
                    if ct and isinstance(ct, str) and not ct.startswith("_"):
                        class_types.add(ct)
    return class_types
