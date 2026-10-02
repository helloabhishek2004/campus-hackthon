import os
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
# import numpy as np
# from sentence_transformers import SentenceTransformer

# NOTE: The actual sentence_transformers import is commented out to allow 
# this to run without large model downloads, but the logic is preserved.

router = APIRouter(prefix="/emergency")

# MOCK: In production, load intfloat/multilingual-e5-small
# embed = SentenceTransformer("intfloat/multilingual-e5-small")

TYPE_PROTOTYPES = {
    "fire":             ["fire in the building", "smoke is coming out", "something is burning"],
    "medical":          ["a student collapsed", "someone is unconscious", "person is bleeding badly"],
    "accident":         ["a road accident happened", "someone fell down the stairs", "two vehicles collided"],
    "security_threat":  ["a man with a weapon", "someone is attacking students", "suspicious person with a bag"],
    "natural_disaster": ["flood water is entering", "strong earthquake tremor", "tree fell during the storm"],
    "hazmat":           ["chemical spill in the lab", "gas leak smell", "toxic fumes in the room"],
    "building_problem": ["ceiling is collapsing", "electrical sparks from the wall", "water pipe burst"],
    "missing_person":   ["student is missing since morning", "cannot find my friend", "child is lost on campus"],
}

# Mocking the embedding generation for the prototype
PROTO_TYPES = []
for t, phrases in TYPE_PROTOTYPES.items():
    for p in phrases:
        PROTO_TYPES.append(t)

TYPE_IDX = {t: [i for i, x in enumerate(PROTO_TYPES) if x == t] for t in TYPE_PROTOTYPES}

MISMATCH_MIN, MARGIN = 0.80, 0.04

class AnalyzeIn(BaseModel):
    text: str
    reported_type: str

def check(auth: str):
    # Disable token check in demo if no token is set
    token = os.environ.get('AI_SERVICE_TOKEN', 'demo-token')
    if auth != f"Bearer {token}":
        raise HTTPException(401)

@router.post("/analyze")
def analyze(body: AnalyzeIn, authorization: str = Header(...)):
    check(authorization)
    
    # Mocking the similarity calculation that would normally use PROTO_EMB @ emb
    # If the text contains keywords from a type, we artificially boost that type's score
    per_type = {t: 0.5 for t in TYPE_IDX.keys()}
    for t, phrases in TYPE_PROTOTYPES.items():
        if any(word in body.text.lower() for phrase in phrases for word in phrase.split()):
            per_type[t] = 0.95
            
    ranked = sorted(per_type.items(), key=lambda kv: -kv[1])
    top_type, top_score = ranked[0]
    reported_score = per_type.get(body.reported_type, 0.0)
    
    mismatch = (top_type != body.reported_type
                and top_score >= MISMATCH_MIN
                and top_score - reported_score >= MARGIN)
                
    return {
        "text_emb": [0.1, 0.2, 0.3], # Mocked 384-d vector
        "type_suggestions": [{"type": t, "score": round(s, 3)} for t, s in ranked[:3]],
        "type_mismatch": mismatch,
    }
