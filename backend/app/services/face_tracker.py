import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

class FaceTrackerService:
    @classmethod
    def calculate_smooth_crops(
        cls,
        video_path: str,
        start_time: float,
        end_time: float,
        target_aspect_ratio: float = 9.0 / 16.0,
        sample_fps: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Samples video frames between start_time and end_time,
        detects face bounding box centroids, and applies an Exponential
        Moving Average (EMA) smoothing filter to prevent jittery camera panning.
        
        Returns a list of crop parameters per time segment:
        [{"timestamp": 0.0, "crop_x": 420, "crop_w": 608, "crop_h": 1080}, ...]
        """
        if not os.path.exists(video_path):
            return [{"timestamp": start_time, "crop_x": 656, "crop_w": 608, "crop_h": 1080}]

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return [{"timestamp": start_time, "crop_x": 656, "crop_w": 608, "crop_h": 1080}]

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        target_w = int(height * target_aspect_ratio)
        max_x = max(0, width - target_w)
        default_x = max_x // 2

        try:
            face_cascade = None
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                face_cascade = cv2.CascadeClassifier(cascade_path)

            raw_centers = []
            timestamps = []
            frame_step = max(1, int(fps / sample_fps))
            current_frame = int(start_time * fps)
            end_frame = int(end_time * fps)

            # Cap frame search count to 15 frames max for lightning-fast responsiveness
            max_samples = 15
            samples_taken = 0

            while current_frame <= end_frame and samples_taken < max_samples:
                try:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
                    ret, frame = cap.read()
                except Exception:
                    break

                if not ret or frame is None:
                    break
                    
                t_sec = current_frame / fps
                timestamps.append(t_sec)
                detected_center_x = default_x + (target_w // 2)

                if face_cascade:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=3, minSize=(60, 60))
                    if len(faces) > 0:
                        largest_face = max(faces, key=lambda r: r[2] * r[3])
                        fx, fy, fw, fh = largest_face
                        detected_center_x = fx + (fw // 2)

                raw_centers.append(detected_center_x)
                current_frame += frame_step
                samples_taken += 1

            cap.release()
        except Exception as e:
            print(f"[FaceTrackerService] Fallback to center-crop: {e}")
            if cap:
                cap.release()
            return [{"timestamp": start_time, "crop_x": default_x, "crop_w": target_w, "crop_h": height}]

        if not raw_centers:
            return [{"timestamp": start_time, "crop_x": default_x, "crop_w": target_w, "crop_h": height}]

        # Apply Exponential Moving Average (EMA) smoothing: S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
        alpha = 0.15 # Smooth transitions without rapid jerky shakes
        smoothed_centers = []
        current_smooth = raw_centers[0]
        
        for c in raw_centers:
            current_smooth = alpha * c + (1 - alpha) * current_smooth
            smoothed_centers.append(current_smooth)

        crop_timeline = []
        for t, cx in zip(timestamps, smoothed_centers):
            # Compute top-left X coordinate, clamping to frame bounds
            crop_x = int(cx - (target_w // 2))
            crop_x = max(0, min(max_x, crop_x))
            crop_timeline.append({
                "timestamp": round(t, 2),
                "crop_x": crop_x,
                "crop_w": target_w,
                "crop_h": height
            })

        return crop_timeline

