from fastapi import FastAPI
from pydantic import BaseModel
from ultralytics import YOLO
import os

app = FastAPI()

# Load model
model = YOLO('yolov8n.pt')

class ImageRequest(BaseModel):
    image_path: str

@app.post("/detect")
def detect_objects(request: ImageRequest):
    # Get absolute path
    base_dir = os.getcwd()
    # The input image path
    input_path = os.path.abspath(os.path.join(base_dir, "..", request.image_path))

    if not os.path.exists(input_path):
        return {"error": "File not found"}

    # Run AI
    results = model(input_path)
    result = results[0] # Get the first result

    # --- NEW: SAVE ANNOTATED IMAGE ---
    # We create a new filename like "myimage_annotated.jpg"
    directory = os.path.dirname(input_path)
    filename = os.path.basename(input_path)
    name, ext = os.path.splitext(filename)
    
    # Define where to save the drawn image
    annotated_filename = f"{name}_annotated{ext}"
    annotated_path = os.path.join(directory, annotated_filename)

    # Plot the boxes and save
    result.save(filename=annotated_path) 
    # ---------------------------------

    # Process detections for text list
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        label = model.names[class_id]
        confidence = float(box.conf[0])
        
        if confidence > 0.5:
            detections.append({
                "label": label,
                "confidence": round(confidence, 2)
            })

    # Return the path to the NEW image so frontend can display it
    # We return the path relative to the server/uploads folder
    return {
        "message": "Success",
        "detections": detections,
        "annotated_image": f"server/uploads/{annotated_filename}" 
    }