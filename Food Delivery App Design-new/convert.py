from moviepy import VideoFileClip
import sys

def convert():
    try:
        clip = VideoFileClip("public/birdy.mov")
        # Resize or compress if needed, but we'll just write it with libx264 which is well supported
        clip.write_videofile("public/birdy.mp4", codec="libx264", audio_codec="aac")
        print("Successfully converted video.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert()
