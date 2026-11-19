import pytest
from backend.app.services.ingest import IngestService

def test_permission_denial_blocks_processing():
    # Strict compliance: users must confirm permission/rights
    with pytest.raises(ValueError) as excinfo:
        IngestService.validate_permission(False)
    assert "Permission Denied" in str(excinfo.value)

def test_permission_granted_passes():
    # Should not raise
    IngestService.validate_permission(True)

def test_media_info_fallback():
    info = IngestService.get_media_info("non_existent_file.mp4")
    assert "duration" in info
    assert "width" in info
    assert "height" in info
    assert "fps" in info

