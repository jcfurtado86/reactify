from moviepy import VideoFileClip

def extract_audio(video_input, audio_output):
    try:
        # Load the video file
        video = VideoFileClip(video_input)
        
        # Extract the audio
        audio = video.audio
        
        # Write the audio file to disk
        audio.write_audiofile(audio_output)
        
        # Close the files to free up memory
        audio.close()
        video.close()
        
        print(f"Successfully extracted: {audio_output}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
extract_audio("/home/kat/Downloads/reuniao.mp4", "extracted_audio.mp3")