import os
from typing import List

class SceneDetectService:
    @staticmethod
    def detect_scenes(video_path: str, threshold: float = 27.0) -> List[float]:
        """
        Detect visual scene cuts using PySceneDetect.
        Returns a list of cut timestamps in seconds.
        """
        if not os.path.exists(video_path):
            return []

        try:
            from scenedetect import open_video, SceneManager, ContentDetector
            video = open_video(video_path)
            scene_manager = SceneManager()
            scene_manager.add_detector(ContentDetector(threshold=threshold))
            
            # Detect scenes over video
            scene_manager.detect_scenes(video)
            scene_list = scene_manager.get_scene_list()
            
            cut_points = []
            for scene in scene_list:
                # scene is tuple (start_timecode, end_timecode)
                cut_points.append(round(scene[1].get_seconds(), 2))
                
            return cut_points
        except Exception as e:
            print(f"[SceneDetectService] Scene detection fallback ({e})")
            return [5.0, 15.0, 30.0, 45.0, 60.0]

    @staticmethod
    def snap_to_nearest_cut(timestamp: float, cuts: List[float], max_delta: float = 1.2) -> float:
        """
        Snaps a start or end timestamp to the closest scene cut
        if within max_delta seconds to ensure seamless visual cuts.
        """
        if not cuts:
            return timestamp
            
        best = timestamp
        min_diff = max_delta
        for cut in cuts:
            diff = abs(cut - timestamp)
            if diff < min_diff:
                min_diff = diff
                best = cut
        return best

