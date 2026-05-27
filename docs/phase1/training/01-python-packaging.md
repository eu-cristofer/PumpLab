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
If the dependency is also needed for daily development on the mamba
track (see below), add it to `environment.yml` in the same commit.

## The two tracks: mamba/conda and venv/pip

PumpLab supports **two** install paths, and you need to understand both
or you will fight one of them. The reasons are operational:

- The project's primary install (per [CLAUDE.md](../../../CLAUDE.md) and
  [environment.yml](../../../environment.yml)) is mamba/conda. Many
  engineering users run on corporate networks where conda is the only
  channel they can reach, and where native dependencies (HDF5, MKL, GDAL
  in adjacent projects) compile cleanly through conda but fight pip's
  wheel resolution. Mamba is faster than conda and uses the same
  manifest.
- CI runners, fresh contributor machines, and isolated test
  environments use venv + pip — fewer moving parts, no channel config,
  no `.condarc`. The Sprint 0 gate review installed into a throwaway
  `.venv-test/` exactly this way.

These tracks meet at one place: `pyproject.toml`. Mamba reads
`environment.yml`, then in its `pip:` section invokes pip with
`-e .[dev]` — which reads `pyproject.toml`. So `pyproject.toml` is
required even on the mamba track; it is *not* a "pip-only" file.

### Track A — mamba/conda (daily-driver setup)

```bash
mamba env create -f environment.yml
mamba activate pump
```

What this does, end to end:

1. Reads [environment.yml](../../../environment.yml), which lists conda
   packages (`python=3.12`, `numpy`, `pint`, `matplotlib`, the Jupyter
   stack, …) under `dependencies:`.
2. Resolves them against whatever channels your `~/.condarc`
   configured. `environment.yml` deliberately omits a `channels:`
   block: the right channel depends on whether you're on the company
   VPN or the open internet. Put the channel in `~/.condarc`, not in
   the manifest.
3. After conda packages install, the `pip:` section at the bottom runs
   `pip install -e .[dev]` inside the new env. This is what wires up
   `pyproject.toml` — without it, the `pump` package is not importable
   from a notebook even though numpy etc. are present.

To update the env after pulling new code:

```bash
mamba env update -f environment.yml
```

### Track B — venv + pip (CI, fresh contributors, throwaway test envs)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
```

The Sprint 0 gate review used a `.venv-test/` directory with exactly
this flow. It is the minimum needed to prove "a fresh machine can
install and run the package," and it is what GitHub Actions / CI will
run.

### Choosing a track

| You are… | Use |
|---|---|
| On the company VPN with conda channel restrictions | Mamba |
| Adding a runtime dep that has native code (BLAS, HDF5, geospatial) | Mamba — let conda handle the binary |
| A new contributor who just cloned the repo | Mamba if you have it; venv+pip if not |
| Running CI / smoke-testing a clean install | venv + pip |
| Building the Sprint-2 desktop bundle | venv + pip (the bundle ships its own Python) |
| Trying to reproduce a teammate's bug | Same track they used |

### Keeping the two manifests in sync

Every runtime dependency must appear in **both** `pyproject.toml` and
`environment.yml`. Forgetting one is silent: the track you tested still
works, the other one breaks on `ImportError` for someone else.

A simple discipline:

1. When you `import foo` somewhere in `pump/`, the same commit must add
   `foo` to `pyproject.toml`'s `[project.dependencies]`.
2. If `foo` is also useful at notebook / interactive time, add it to
   `environment.yml`'s `dependencies:` block too — conda's binary
   wheel is usually faster than pip's source build.
3. Test the change on both tracks before merging, or at least run CI on
   one and have a teammate verify the other.

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
  install lacks a package yours has. See "The two tracks" above for the
  discipline.
- **Hardcoding a `channels:` block in `environment.yml`.** Don't.
  Channels belong in `~/.condarc` because they depend on whether the
  machine is on the company VPN or the open internet. The current
  `environment.yml` has a banner comment about this — leave it intact.
- **`mamba activate` vs. `conda activate` confusion.** Either works once
  the env exists; pick one and stay consistent so your shell history is
  reproducible. Mamba is just a faster front-end to the same env store.
- **Editing in one track, testing in the other.** If you `pip install`
  a new package into your mamba env without adding it to
  `environment.yml`, your env works but no one else's does. Treat both
  manifests as source-of-truth and the running env as derived state.
