virtualenv .venv
. .venv/bin/activate
git clone --recursive https://github.com/ipython/ipython.git
cd ipython
pip install -e ".[notebook]"

