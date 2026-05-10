import sys
from pathlib import Path

# Ensure the project root is on sys.path so `pipeline` resolves to the
# top-level pipeline/ package rather than tests/pipeline/.
sys.path.insert(0, str(Path(__file__).parent))
