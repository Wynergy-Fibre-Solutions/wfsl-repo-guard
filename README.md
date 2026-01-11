\# WFSL Repo Admission Guard



Deterministic repo hygiene and release sequencing enforcement with evidence emission.



This tool prevents common, costly errors such as committing node\_modules, publishing without required files, or tagging before a remote exists.



\## Usage



```bash

wfsl-repo-guard check --root . --mode repo

wfsl-repo-guard check --root . --mode marketplace



