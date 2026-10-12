import ast
import re
import logging
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("bugx")

class ASTAnalyzer:
    def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        if not file_path.exists():
            return {}

        suffix = file_path.suffix.lower()
        if suffix == ".py":
            return self._analyze_python_ast(file_path)
        elif suffix in [".ts", ".js", ".tsx", ".jsx"]:
            return self._analyze_js_ts(file_path)
        return {}

    def _analyze_python_ast(self, file_path: Path) -> Dict[str, Any]:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            tree = ast.parse(content, filename=str(file_path))
            
            functions = []
            classes = []
            imports = []

            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions.append({
                        "name": node.name,
                        "line": node.lineno,
                        "args": [arg.arg for arg in node.args.args]
                    })
                elif isinstance(node, ast.ClassDef):
                    classes.append({
                        "name": node.name,
                        "line": node.lineno
                    })
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)

            return {
                "functions": functions,
                "classes": classes,
                "imports": imports
            }
        except Exception as e:
            logger.debug(f"AST parsing failed for {file_path}: {e}")
            return {}

    def _analyze_js_ts(self, file_path: Path) -> Dict[str, Any]:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            # Extract function declarations & async functions using regex fallback
            fn_matches = re.findall(r"(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(", content)
            const_fn_matches = re.findall(r"const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(", content)
            
            functions = [{"name": name, "line": 0} for name in (fn_matches + const_fn_matches)]
            return {"functions": functions}
        except Exception:
            return {}
