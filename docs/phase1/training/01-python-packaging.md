# 1. Python packaging — `pyproject.toml`, editable installs, venvs

## The principle

A Python "package" is not a folder of `.py` files. It's a folder of `.py`
files **plus** a manifest that says: this is the name, this is the version,
these are the dependencies, this is the Python floor, this is the build
backend. Without that manifest, `pip install` has nothing to do and other
tools (pytest, uvicorn, your IDE, CI) cannot find your code reliably.

The manifest format the Python ecosystem agreed on (PEP 517 / PEP 621) is
`pyproject.toml`. It replaces `setup.py`.

## The Sprint 0 reference

[pyproject.toml](../../../pyproject.toml) is the whole story. The shape:

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "pumplab"
version = "0.0.1"
requires-python = ">=3.12"
dependencies = [
    "pint>=0.23",
    "numpy>=1.26",
    "matplotlib>=3.8",
    "tabulate>=0.9",
    "python-docx>=1.1",
]

[project.optional-dependencies]
api = ["fastapi>=0.110", "uvicorn[standard]>=0.27", "pydantic>=2.6"]
dev = ["pytest>=8.0", "pytest-asyncio>=0.23", "httpx>=0.27", "ruff>=0.4", ...]

[tool.setuptools.packages.find]
where = ["."]
include = ["pump*"]
exclude = ["tests*", "examples*", "PumpLabGUI*", "docs*"]

[tool.setuptools.package-data]
"pump" = [
    "templates/*.docx",
    "utilities/locales/*/LC_MESSAGES/*.po",
    "utilities/locales/*/LC_MESSAGES/*.mo",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

Four sections worth memorising:

1. **`[build-system]`** — tells `pip` *how* to build the package. Setuptools
   is the default; Hatch / Flit / Poetry are alternatives. Pick one and stop
   thinking about it.
2. **`[project]`** — metadata. The required fields are `name` and `version`;
   everything else is convention. `requires-python` is what stops a 3.10
   user from getting a confusing runtime error 200 lines into your code.
3. **`[project.optional-dependencies]`** — extras. Installed with bracketed
   syntax: `pip install -e ".[dev]"`. Keep runtime deps in
   `[project.dependencies]`, test/lint deps in an `dev` extra, web deps in
   an `api` extra. This is how you keep a desktop bundle slim.
4. **`[tool.setuptools.package-data]`** — non-Python files that must travel
   with the wheel. Without this line, the `.docx` templates and `.mo`
   translation catalogues would not be in your installed package and the
   report generator would fail at runtime — but tests would still pass from
   the source tree.

## The recipe

### Create a venv, install editable

```bash
python3 -m venv .venv
source .venv/bin/activate            # POSIX
# .venv\Scripts\activate.bat         # Windows
pip install --upgrade pip
pip install -e ".[dev]"
```

What each step does:

- `python3 -m venv .venv` — creates an isolated interpreter at `.venv/`.
  Nothing you `pip install` afterwards touches your system Python.
- `pip install -e .` — "editable" install. Instead of copying your source
  into `site-packages`, pip writes a `.pth` file that points back to the
  project root. Edit a `.py` file, re-run pytest, see the change. No
  reinstall needed.
- `".[dev]"` — install the `dev` extras alongside the core package.

### Verify the install

```bash
python -c "import pump; print(pump.__version__)"
pip list | grep pumplab
```

If `import pump` fails after `pip install -e .` succeeded, you almost
certainly excluded the package by accident in
`[tool.setuptools.packages.find]` — the `include = ["pump*"]` glob is the
common foot-gun. Check it before blaming the venv.

### Add a new dependency

Edit `pyproject.toml` → add the line under the appropriate dependency list
→ re-run `pip install -e ".[dev]"`. Do not `pip install <foo>` ad-hoc; the
venv state will drift from the manifest and the next clean clone breaks.

## Pitfalls

- **Pinned vs. open versions.** `pint>=0.23` is a floor, not a pin. For a
  research project that is fine. When v1.0 ships you'll add a `uv.lock` /
  `pip-tools` lockfile so CI and the desktop bundle install identical
  graphs every time.
- **The `--no-build-isolation` shortcut.** Tempting on slow networks; never
  use it without a lockfile. It silently picks up whatever happens to be in
  your venv at the moment, breaking reproducibility.
- **Editable installs and namespace packages.** If you create a sub-package
  later (`pump.api`, `pump.system_curves`) and pytest can't find it, the
  cause is almost always a missing `__init__.py` or a bad `include` glob.
  The `pump.api` package in Sprint 0 needed an `__init__.py` for exactly
  this reason — see [pump/api/__init__.py](../../../pump/api/__init__.py).
- **`pyproject.toml` is not your channel manifest.** `environment.yml`
  exists alongside it for conda users. Keep both in sync when you add
  runtime dependencies; mismatches are silent until a teammate's conda
  install lacks a package yours has.
