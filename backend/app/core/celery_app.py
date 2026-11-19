import os
from backend.app.core.config import settings

try:
    from celery import Celery
    celery_app = Celery(
        "clipforge_worker",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        include=[
            "backend.app.tasks.ingest_tasks",
            "backend.app.tasks.analysis_tasks",
            "backend.app.tasks.render_tasks",
            "backend.app.tasks.live_tasks",
        ]
    )
    celery_app.conf.update(
        task_track_started=True,
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_always_eager=settings.CELERY_ALWAYS_EAGER,
    )
except ImportError:
    # Synchronous eager task fallback for environments without Celery/Redis
    class MockTask:
        def __init__(self, func):
            self.func = func
        def delay(self, *args, **kwargs):
            import threading
            t = threading.Thread(target=self.func, args=args, kwargs=kwargs)
            t.daemon = True
            t.start()
            return self
        def __call__(self, *args, **kwargs):
            return self.func(*args, **kwargs)

    class MockCelery:
        def task(self, *args, **kwargs):
            def decorator(f):
                return MockTask(f)
            return decorator

    celery_app = MockCelery()
