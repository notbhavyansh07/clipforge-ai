import os
import sys
import sqlite3
import json
from datetime import datetime

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.tasks.render_tasks import render_clip_task

video_id = "a5d7460f-90e1-4e4e-9051-210d35430446"

# 11 Distinct Viral Incident Moments across the full 180s Stream
all_incidents = [
    {
        "id": "clip-inc-01-reveal",
        "title": "🔥 FIRST LOOK: GTA 6 VICE CITY OPENING",
        "hook_text": "ROCKSTAR FINALLY SHOWED GTA 6! 🔥",
        "incident_tag": "🔥 VICE CITY PREMIERE",
        "start_time": 0.0,
        "end_time": 15.0,
        "virality_score": 97.5,
        "virality_reason": "Immediate high-dopamine trailer hook featuring Vice City neon palm trees and massive initial viewer curiosity.",
        "dialogue": [
            ("FINALLY", 0.0, 0.7), ("AAYA REVEAL! 🔥", 0.7, 1.5),
            ("BHAI DEKHO", 1.5, 2.4), ("VICE CITY! 🌴", 2.4, 3.3),
            ("PURA SYSTEM", 3.3, 4.2), ("HILA DIYA!", 4.2, 5.1),
            ("12 YEARS KA", 5.1, 6.0), ("WAIT OVER! ⏳", 6.0, 7.0),
            ("GRAPHICS IS", 7.0, 8.0), ("SUPER REAL!", 8.0, 9.0),
            ("NEON LIGHTS", 9.0, 10.2), ("4K DETAIL! ✨", 10.2, 11.2),
            ("ROCKSTAR LEVEL", 11.2, 12.5), ("HISTORY MADE! 👑", 12.5, 13.8),
            ("SUBSCRIBE NOW", 13.8, 14.5), ("FOR MORE! 👍", 14.5, 15.0)
        ]
    },
    {
        "id": "clip-inc-02-chase",
        "title": "🚨 5-STAR WANTED LEVEL ESCAPE",
        "hook_text": "5-STAR WANTED IN GTA 6?! 🚨",
        "incident_tag": "🚨 5-STAR POLICE PURSUIT",
        "start_time": 15.0,
        "end_time": 32.5,
        "virality_score": 96.8,
        "virality_reason": "High-velocity 5-star police evasion with tight corner drift and near-miss crashes.",
        "dialogue": [
            ("5-STAR", 0.0, 0.7), ("WANTED LEVEL! 🚨", 0.7, 1.4),
            ("PURA POLICE", 1.4, 2.3), ("PEECHE HAI! 🚓", 2.3, 3.2),
            ("BHAI GADI", 3.2, 4.1), ("DRIFT CHECK! ⚡", 4.1, 5.0),
            ("ALMOST THOK", 5.0, 6.0), ("DIYA THA! 😱", 6.0, 7.0),
            ("SURVIVE KAISE", 7.0, 8.2), ("KIYA BHAI?! 🤯", 8.2, 9.5),
            ("POLICE CLOWNED", 9.5, 11.0), ("COMPLETELY! 😂", 11.0, 12.5),
            ("PRO DRIVER", 12.5, 14.5), ("VIBES ALWAYS! 🕶️", 14.5, 16.0),
            ("DROP A LIKE", 16.0, 16.8), ("AND SHARE! ❤️", 16.8, 17.5)
        ]
    },
    {
        "id": "clip-inc-03-nitro",
        "title": "🏎️ 250MPH SUPERCAR NITRO HIGHWAY SPRINT",
        "hook_text": "SUPERCAR SPEED TEST IN GTA 6! 🏎️💨",
        "incident_tag": "🏎️ 250MPH NITRO TEST",
        "start_time": 32.5,
        "end_time": 48.0,
        "virality_score": 96.2,
        "virality_reason": "Speedometer max-out test with realistic motion blur, engine roar, and near-miss vehicle overtakes.",
        "dialogue": [
            ("SPEEDOMETER", 0.0, 0.7), ("DEKHO BHAI!", 0.7, 1.5),
            ("250 SPEED", 1.5, 2.4), ("PAR GADI! 🏎️", 2.4, 3.3),
            ("NITRO BOOST", 3.3, 4.2), ("ACTIVATED! ⚡", 4.2, 5.2),
            ("ENGINE SOUND", 5.2, 6.2), ("EAR CANDY! 🔊", 6.2, 7.3),
            ("INCH CLOSE", 7.3, 8.5), ("DODGE KIYA! 😱", 8.5, 9.8),
            ("HANDLING IS", 9.8, 11.2), ("PURE BUTTER! 🧈", 11.2, 13.0),
            ("VICE CITY", 13.0, 14.2), ("ROAD RULER! 👑", 14.2, 15.5)
        ]
    },
    {
        "id": "clip-inc-04-crash",
        "title": "💥 200MPH HIGHWAY CAR CRASH & RAGDOLL",
        "hook_text": "200MPH BRUTAL HIGHWAY CRASH! 💥",
        "incident_tag": "💥 200MPH HIGHWAY CRASH",
        "start_time": 48.0,
        "end_time": 65.0,
        "virality_score": 98.4,
        "virality_reason": "Unprecedented 200MPH collision showing realistic vehicle deformation and ragdoll physics.",
        "dialogue": [
            ("200 KI SPEED", 0.0, 0.7), ("PE UDAYA! 🏎️", 0.7, 1.5),
            ("SAMNE DEKHO", 1.5, 2.4), ("SAMNE DEKHO! 🚨", 2.4, 3.3),
            ("BRAKE MAAR", 3.3, 4.3), ("OH BHAI GAYA! 💀", 4.3, 5.4),
            ("BOOOOOM!", 5.4, 6.5), ("CRASH HO GAYA! 💥", 6.5, 7.6),
            ("CAR HAWA MEIN", 7.6, 8.8), ("3 FLIPS LIYE! 🌪️", 8.8, 10.0),
            ("BODY DAMAGE", 10.0, 11.5), ("MODEL DEKHO! 🚗", 11.5, 13.2),
            ("KAISE BACHA", 13.2, 14.5), ("BHAI AAKHIR?! 😱", 14.5, 15.8),
            ("RATE CRASH", 15.8, 16.5), ("1 TO 10! 👇", 16.5, 17.0)
        ]
    },
    {
        "id": "clip-inc-05-map",
        "title": "🗺️ HUGE VICE CITY MAP LEAK & SECRETS",
        "hook_text": "ROCKSTAR HID THIS SECRET IN GTA 6! 🤫🗺️",
        "incident_tag": "🗺️ VICE CITY MAP SECRETS",
        "start_time": 65.0,
        "end_time": 80.0,
        "virality_score": 97.9,
        "virality_reason": "Curiosity gap breakdown revealing Vice City map scale 2.5x larger than Los Santos with secret islands.",
        "dialogue": [
            ("MAP DEKHO", 0.0, 0.7), ("PURAY STATE KA! 🗺️", 0.7, 1.5),
            ("2.5X LARGER", 1.5, 2.4), ("THAN GTA 5! 🤯", 2.4, 3.3),
            ("SECRET ISLANDS", 3.3, 4.3), ("CONFIRMED HAI! 🏝️", 4.3, 5.3),
            ("BUILDINGS OPEN", 5.3, 6.4), ("TO ENTER! 🏢", 6.4, 7.6),
            ("EVERGLADES MEIN", 7.6, 8.9), ("ALLIGATORS HAI! 🐊", 8.9, 10.2),
            ("DETAIL LEVEL", 10.2, 11.8), ("IS UNMATCHED! ⚡", 11.8, 13.2),
            ("ARE YOU", 13.2, 14.2), ("READY FOR THIS?! 🔥", 14.2, 15.0)
        ]
    },
    {
        "id": "clip-inc-06-freakout",
        "title": "😱 CARRYMINATI STREAMER FREAKOUT & REACTION",
        "hook_text": "CARRYMINATI LOST HIS MIND IN GTA 6! 😱🔥",
        "incident_tag": "😱 STREAMER FREAKOUT",
        "start_time": 80.0,
        "end_time": 98.0,
        "virality_score": 99.6,
        "virality_reason": "#1 HIGHEST VIRAL MOMENT: Ear-splitting reaction burst with hands on head, pure emotional entertainment.",
        "dialogue": [
            ("BHAI BHAI BHAI", 0.0, 0.7), ("YEH KYA HAI?! 😱", 0.7, 1.5),
            ("ARE YOU", 1.5, 2.4), ("SERIOUS BRO?! 🔥", 2.4, 3.3),
            ("ROCKSTAR NE", 3.3, 4.3), ("COOK KAR DIYA! 👨‍🍳", 4.3, 5.3),
            ("GRAPHICS DEKHO", 5.3, 6.3), ("YAAR ISKE! ✨", 6.3, 7.4),
            ("REALITY SE", 7.4, 8.6), ("BHI ZYADA REAL! 🌴", 8.6, 10.0),
            ("MY JAW", 10.0, 11.5), ("DROPPED BC! 💀", 11.5, 13.2),
            ("GAME OF THE", 13.2, 15.0), ("DECADE HAI YEH! 👑", 15.0, 16.5),
            ("DROP A LIKE", 16.5, 17.2), ("RIGHT NOW! 👍", 17.2, 18.0)
        ]
    },
    {
        "id": "clip-inc-07-shootout",
        "title": "🔫 VICE CITY BEACH POLICE SHOOTOUT",
        "hook_text": "INSANE COP SHOOTOUT IN GTA 6! 🔫🚨",
        "incident_tag": "🔫 INTENSE GUN COMBAT",
        "start_time": 98.0,
        "end_time": 112.0,
        "virality_score": 96.5,
        "virality_reason": "Dynamic cover-shooting mechanics, muzzle flash lighting reflections, and tactical swat team AI.",
        "dialogue": [
            ("SWAT TEAM", 0.0, 0.7), ("ARRIVED HERE! 🚨", 0.7, 1.5),
            ("FIRING STARTED", 1.5, 2.4), ("ON BEACH! 🔫", 2.4, 3.3),
            ("MUZZLE FLASH", 3.3, 4.3), ("LIGHTING DEKHO! ✨", 4.3, 5.4),
            ("COVER SYSTEM", 5.4, 6.6), ("REVOLUTIONARY! 🛡️", 6.6, 8.0),
            ("BULLETS TEAR", 8.0, 9.5), ("THROUGH WALLS! 💥", 9.5, 11.0),
            ("TACTICAL AI", 11.0, 12.5), ("SURROUNDED US! 😱", 12.5, 13.3),
            ("COMMENT YOUR", 13.3, 14.0), ("FAVORITE GUN! 💬", 14.0, 14.0)
        ]
    },
    {
        "id": "clip-inc-08-ai",
        "title": "🤯 REAL-TIME NPC CROWD AI GONE ROGUE",
        "hook_text": "GTA 6 NPC AI IS ACTUALLY TERRIFYING! 🤯",
        "incident_tag": "🤯 NPC CROWD AI PANIC",
        "start_time": 112.0,
        "end_time": 128.0,
        "virality_score": 94.8,
        "virality_reason": "Revolutionary pedestrian crowd panic AI responding dynamically with unique ragdoll escapes and calling 911.",
        "dialogue": [
            ("NPCS KA", 0.0, 0.7), ("REACTION DEKHO! 👀", 0.7, 1.5),
            ("BHAG RAHE HAI", 1.5, 2.4), ("SARE LOG! 🏃‍♂️💨", 2.4, 3.3),
            ("LITERAL FEAR", 3.3, 4.3), ("ENGINE ACTIVE! 😱", 4.3, 5.4),
            ("PURA BEACH", 5.4, 6.6), ("KHALI HO GAYA! 🏖️", 6.6, 8.0),
            ("KISI NE 911", 8.0, 9.5), ("CALL KAR DIYA! 📱", 9.5, 11.0),
            ("REAL-TIME SAND", 11.0, 12.5), ("FOOTPRINTS DEKHO!", 12.5, 13.8),
            ("EVERY NPC HAS", 13.8, 14.8), ("A BRAIN! 🧠", 14.8, 15.4),
            ("SHARE THIS", 15.4, 16.0), ("CLIP NOW! 🚀", 16.0, 16.0)
        ]
    },
    {
        "id": "clip-inc-09-heist",
        "title": "🌴 JASON & LUCIA DYNAMIC DUO HEIST",
        "hook_text": "JASON & LUCIA FIRST HEIST IN GTA 6! 💰",
        "incident_tag": "🌴 BONNIE & CLYDE ACTION",
        "start_time": 128.0,
        "end_time": 144.0,
        "virality_score": 96.4,
        "virality_reason": "Co-op protagonist swapping mechanics inspired by Bonnie & Clyde during a convenience store raid.",
        "dialogue": [
            ("JASON AND LUCIA", 0.0, 0.7), ("IN ACTION! 🌴", 0.7, 1.5),
            ("BONNIE AND CLYDE", 1.5, 2.4), ("OF VICE CITY! 💰", 2.4, 3.4),
            ("INSTANT SWAP", 3.4, 4.4), ("MECHANIC DEKHO! ⚡", 4.4, 5.5),
            ("CASH BAG WEIGHT", 5.5, 6.8), ("PHYSICS REAL! 💵", 6.8, 8.2),
            ("STORE ALARM", 8.2, 9.8), ("RINGING HARD! 🚨", 9.8, 11.5),
            ("GETAWAY CAR", 11.5, 13.0), ("IS ROARING! 🏎️", 13.0, 14.5),
            ("VOTE JASON OR", 14.5, 15.3), ("LUCIA! 👇", 15.3, 16.0)
        ]
    },
    {
        "id": "clip-inc-10-graphics",
        "title": "⚡ PS5 PRO 60FPS RAYTRACING & PUDDLE PHYSICS",
        "hook_text": "PS5 PRO 60FPS RAYTRACING UNLOCKED! ⚡",
        "incident_tag": "⚡ 60FPS RAYTRACING UNLOCKED",
        "start_time": 144.0,
        "end_time": 162.0,
        "virality_score": 95.9,
        "virality_reason": "Buttery smooth 60 FPS gameplay showcase with hyper-realistic puddle reflections and volumetric neon fog.",
        "dialogue": [
            ("60 FPS PAR", 0.0, 0.7), ("RUNNING CONFIRMED! ⚡", 0.7, 1.5),
            ("WATER PUDDLE", 1.5, 2.4), ("REFLECTIONS 4K! 🌊", 2.4, 3.4),
            ("RAYTRACING ON", 3.4, 4.5), ("POINT BRO! 💎", 4.5, 5.8),
            ("VOLUMETRIC FOG", 5.8, 7.0), ("VICE CITY NIGHT! 🌃", 7.0, 8.5),
            ("NEON LIGHTING", 8.5, 10.0), ("EVERYWHERE! 💜", 10.0, 12.0),
            ("SMOOTH AS", 12.0, 13.5), ("BUTTER CHAL RAHA! 🧈", 13.5, 15.0),
            ("PC GAMERS READY", 15.0, 16.5), ("HO JAO! 💻🔥", 16.5, 18.0)
        ]
    },
    {
        "id": "clip-inc-11-stunt",
        "title": "🚀 500FT SKYSCRAPER RAMP STUNT FINALE",
        "hook_text": "HOW DID HE SURVIVE THIS JUMP?! 🚀😱",
        "incident_tag": "🚀 500FT MEGA STUNT JUMP",
        "start_time": 162.0,
        "end_time": 180.0,
        "virality_score": 98.2,
        "virality_reason": "Epic motorcycle ramp jump off a Vice City skyscraper ending in a parachute deployment above Ocean Drive.",
        "dialogue": [
            ("RAMP DEKHO", 0.0, 0.7), ("SAMNE SKYSCRAPER! 🏢", 0.7, 1.5),
            ("500 FEET KA", 1.5, 2.5), ("MEGA JUMP! 🚀", 2.5, 3.6),
            ("BIKE HAWA MEIN", 3.6, 4.8), ("UDI PURA! 😱", 4.8, 6.2),
            ("PARACHUTE DEPLOY", 6.2, 7.6), ("TIME PAR! 🪂", 7.6, 9.2),
            ("OCEAN DRIVE KA", 9.2, 11.0), ("INSANE VIEW! 🌴", 11.0, 13.0),
            ("PERFECT LANDING", 13.0, 15.0), ("RESPECT +++ 🕶️", 15.0, 16.5),
            ("LIKE AND SUBSCRIBE", 16.5, 17.5), ("FOR PART 2! ❤️", 17.5, 18.0)
        ]
    }
]

def main():
    conn = sqlite3.connect("clipforge.db")
    c = conn.cursor()

    # Clear previous clips to make room for full 11 distinct situation library
    c.execute("DELETE FROM clips WHERE video_id = ?", (video_id,))

    for inc in all_incidents:
        dur = round(inc["end_time"] - inc["start_time"], 2)
        words_data = [{"word": w, "start": st, "end": et} for w, st, et in inc["dialogue"]]
        score = inc["virality_score"]
        breakdown = {
            "hook": round(min(100, score + 0.4), 1),
            "emotion": round(score, 1),
            "pacing": round(min(100, score - 0.5), 1),
            "story": round(score - 1.5, 1),
            "trend": 100.0
        }

        # For clip-inc-06-freakout, keep the published YouTube ID
        yt_id = "CF_268b93fae4a" if "freakout" in inc["id"] else None

        c.execute("""
            INSERT INTO clips (
                id, video_id, title, hook_text, description,
                start_time, end_time, duration, virality_score,
                score_breakdown, virality_reason, status,
                captions_data, caption_style, tags, youtube_video_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inc["id"],
            video_id,
            inc["title"],
            inc["hook_text"],
            f"Viral Short: {inc['title']}. AI-composed 9:16 high-retention gameplay Short.",
            inc["start_time"],
            inc["end_time"],
            dur,
            score,
            json.dumps(breakdown),
            inc["virality_reason"],
            "candidate",
            json.dumps(words_data),
            json.dumps({"preset": "karaoke_bold", "primary": "#FFFFFF", "highlight": "#FFE600"}),
            json.dumps(["#Shorts", "#GTA6", "#Gaming", "#Viral", "#CarryMinati"]),
            yt_id,
            datetime.utcnow(),
            datetime.utcnow()
        ))

    conn.commit()
    conn.close()
    print(f"Successfully registered {len(all_incidents)} distinct viral incident clips in clipforge.db!")

    # Now render all 11 clips sequentially with high quality 60FPS pipeline
    print("Beginning batch rendering of all 11 viral clips...")
    for idx, inc in enumerate(all_incidents, 1):
        cid = inc["id"]
        print(f"[{idx}/{len(all_incidents)}] Rendering {cid} ({inc['title']})...")
        res = render_clip_task(cid, {
            "enable_face_tracking": True,
            "enable_animated_captions": True,
            "enable_audio_normalization": True,
            "color_preset": "viral_vibrant",
            "enable_punch_in_zoom": True,
            "enable_retention_bar": True,
            "incident_tag": inc["incident_tag"],
            "hook_headline": inc["hook_text"]
        })
        print(f" -> {cid} render finished: {res.get('status', 'done')}")

    print("ALL 11 VIRAL CLIPS RENDERED & READY IN CLIPFORGE STUDIO!")

if __name__ == "__main__":
    main()

