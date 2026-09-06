import os
import random
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Nécessaire pour l'insertion massive
supabase: Client = create_client(url, key)

def generate_quiz_questions():
    print("🔄 Récupération des groupes depuis Supabase...")
    response = supabase.table("bands").select("id, name, formed, country, status, genre_pillar").execute()
    bands = response.data

    if not bands:
        print("❌ Aucun groupe trouvé.")
        return

    questions_to_insert = []
    pillars = list(set(b["genre_pillar"] for b in bands if b["genre_pillar"]))

    print(f"🎸 Génération des questions pour {len(bands)} groupes...")

    for band in bands:
        pillar = band["genre_pillar"] or "Heavy Metal"
        # Filtrer les groupes du même pilier pour des mauvaises réponses plausibles
        same_pillar_bands = [b for b in bands if b["genre_pillar"] == pillar and b["id"] != band["id"]]
        
        if len(same_pillar_bands) < 3:
            continue # Pas assez de données pour générer des distracteurs

        # 1. Question sur l'année de formation
        if band["formed"]:
            wrong_years = list(set(str(b["formed"]) for b in random.sample(same_pillar_bands, 3) if b["formed"]))
            if len(wrong_years) >= 3:
                questions_to_insert.append({
                    "band_id": band["id"],
                    "question_type": "formed",
                    "question_text": f"En quelle année le groupe {band['name']} a-t-il été formé ?",
                    "correct_answer": str(band["formed"]),
                    "wrong_answers": wrong_years[:3],
                    "difficulty": 2,
                    "pillar_id": pillar
                })

        # 2. Question sur le pays
        if band["country"] and band["country"] != "Unknown":
            wrong_countries = list(set(b["country"] for b in random.sample(same_pillar_bands, 3) if b["country"] and b["country"] != "Unknown"))
            if len(wrong_countries) >= 3:
                questions_to_insert.append({
                    "band_id": band["id"],
                    "question_type": "country",
                    "question_text": f"De quel pays est originaire le groupe {band['name']} ?",
                    "correct_answer": band["country"],
                    "wrong_answers": wrong_countries[:3],
                    "difficulty": 1,
                    "pillar_id": pillar
                })

    print(f"🚀 Insertion de {len(questions_to_insert)} questions dans Supabase...")
    
    # Insérer par lots de 100 pour éviter les limites de payload
    for i in range(0, len(questions_to_insert), 100):
        batch = questions_to_insert[i:i+100]
        supabase.table("quiz_questions").insert(batch).execute()
        print(f"✅ Lot {i//100 + 1} inséré.")

    print("🎉 Génération des questions de quiz terminée avec succès !")

if __name__ == "__main__":
    generate_quiz_questions()
