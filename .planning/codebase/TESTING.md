# Testing

## State of Testing
Testing currently operates on an ad-hoc, manual verification basis. There is **no automated testing framework** connected to CI pipelines, and tests do not conform to standard Python `pytest` conventions or React `jest`/`vitest` testing.

## Present Testing Artifacts
There is a collection of manual standalone procedural scripts used to smoke-test underlying integrations securely isolated from the larger framework context.
Examples present in the root map:
- `test_manim_flow.py`
- `test_manim_simple.py`
- `test_nvidia_api.py`
- `test_animation_flow.py`
- `test_phi4_prompt.py`

## Needed Testing Upgrades
- **Unit Testing**: Core extraction logic in `PyMuPDF` and JSON auto-repair methods.
- **Integration Testing**: An end-to-end framework validating the RAG workflow and animation pipeline.
- **Frontend Validation**: No testing layer is instantiated yet in `new_ui`. Consideration config needed for `vitest` due to `vite` tooling.
