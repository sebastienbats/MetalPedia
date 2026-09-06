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
    
    # Créer un dictionnaire des groupes par pilier pour un accès rapide et propre
    bands_by_pillar = {}
    for b in bands:
        pillar = b["genre_pillar"] or "Heavy Metal"
        if pillar not in bands_by_pillar:
            bands_by_pillar[pillar] = []
        bands_by_pillar[pillar].append(b)

    print(f"🎸 Génération des questions pour {len(bands)} groupes...")

    for band in bands:
        pillar = band["genre_pillar"] or "Heavy Metal"
        same_pillar_bands = bands_by_pillar.get(pillar, [])
        
        # ─────────────────────────────────────────────────────
        # 1. Question sur l'année de formation
        # ─────────────────────────────────────────────────────
        if band["formed"]:
            correct_val = str(band["formed"])
            # Trouver toutes les années UNIQUES des AUTRES groupes du même pilier, DIFFÉRENTES de la bonne réponse
            potential_wrongs = list(set(
                str(b["formed"]) for b in same_pillar_bands 
                if b["formed"] and str(b["formed"]) != correct_val
            ))
            
            # On ne garde la question que si on a au moins 3 mauvaises réponses uniques
            if len(potential_wrongs) >= 3:
                wrong_answers = random.sample(potential_wrongs, 3)
                questions_to_insert.append({
                    "band_id": band["id"],
                    "question_type": "formed",
                    "question_text": f"En quelle année le groupe {band['name']} a-t-il été formé ?",
                    "correct_answer": correct_val,
                    "wrong_answers": wrong_answers,
                    "difficulty": 2,
                    "pillar_id": pillar
                })

        # ─────────────────────────────────────────────────────
        # 2. Question sur le pays
        # ─────────────────────────────────────────────────────
        if band["country"] and band["country"] != "Unknown":
            correct_val = band["country"]
            potential_wrongs = list(set(
                b["country"] for b in same_pillar_bands 
                if b["country"] and b["country"] != "Unknown" and b["country"] != correct_val
            ))
            
            if len(potential_wrongs) >= 3:
                wrong_answers = random.sample(potential_wrongs, 3)
                questions_to_insert.append({
                    "band_id": band["id"],
                    "question_type": "country",
                    "question_text": f"De quel pays est originaire le groupe {band['name']} ?",
                    "correct_answer": correct_val,
                    "wrong_answers": wrong_answers,
                    "difficulty": 1,
                    "pillar_id": pillar
                })

    print(f"🚀 Insertion de {len(questions_to_insert)} questions dans Supabase...")
    
    # Optionnel : Vider la table avant d'insérer pour éviter les doublons cumulatifs si tu relances le script
    # supabase.table("quiz_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    # Insérer par lots de 100
    for i in range(0, len(questions_to_insert), 100):
        batch = questions_to_insert[i:i+100]
        supabase.table("quiz_questions").insert(batch).execute()
        print(f"✅ Lot {i//100 + 1} inséré.")

    print("🎉 Génération des questions de quiz terminée avec succès !")

if __name__ == "__main__":
    generate_quiz_questions()
