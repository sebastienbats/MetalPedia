import os
import random
import argparse
from collections import Counter
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def generate_quiz_questions(pillar_filter: str = None, country_filter: str = None, clear_table: bool = False, dry_run: bool = False):
    print("🔄 Récupération de TOUS les groupes depuis Supabase...")
    response = supabase.table("bands").select("id, name, formed, country, status, genre_pillar").execute()
    all_bands = response.data

    if not all_bands:
        print("❌ Aucun groupe trouvé dans la base de données.")
        return

    band_lookup = {b["id"]: b for b in all_bands}

    bands_by_pillar = {}
    for b in all_bands:
        pillar = b["genre_pillar"] or "Heavy Metal"
        if pillar not in bands_by_pillar:
            bands_by_pillar[pillar] = []
        bands_by_pillar[pillar].append(b)

    target_bands = all_bands
    active_filters = []

    if pillar_filter:
        target_bands = [b for b in target_bands if (b["genre_pillar"] or "Heavy Metal").lower() == pillar_filter.lower()]
        active_filters.append(f"Pilier='{pillar_filter}'")

    if country_filter:
        target_bands = [b for b in target_bands if (b["country"] or "").lower() == country_filter.lower()]
        active_filters.append(f"Pays='{country_filter}'")

    if not target_bands:
        filter_str = " et ".join(active_filters) if active_filters else "Aucun"
        print(f"❌ Aucun groupe trouvé correspondant aux filtres : {filter_str}")
        return

    filter_str = " et ".join(active_filters) if active_filters else "Tous les groupes"
    print(f"🎸 Génération des questions pour {len(target_bands)} groupes (Filtres : {filter_str})...")

    questions_to_insert = []
    gen_q_by_country = Counter()
    gen_q_by_pillar = Counter()

    for band in target_bands:
        pillar = band["genre_pillar"] or "Heavy Metal"
        same_pillar_bands = bands_by_pillar.get(pillar, [])
        country = band["country"] or "Unknown"
        
        # 1. Question sur l'année de formation
        if band["formed"]:
            correct_val = str(band["formed"])
            potential_wrongs = list(set(
                str(b["formed"]) for b in same_pillar_bands 
                if b["formed"] and str(b["formed"]) != correct_val
            ))
            
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
                gen_q_by_country[country] += 1
                gen_q_by_pillar[pillar] += 1

        # 2. Question sur le pays
        if country and country.lower() != "unknown":
            correct_val = country
            potential_wrongs = list(set(
                b["country"] for b in same_pillar_bands 
                if b["country"] and b["country"].lower() != "unknown" and b["country"] != correct_val
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
                gen_q_by_country[country] += 1
                gen_q_by_pillar[pillar] += 1

    if not questions_to_insert:
        print("⚠️ Aucune question n'a pu être générée (pas assez de données pour créer des distracteurs valides).")
        return

    print(f"\n🚀 {len(questions_to_insert)} questions prêtes pour le traitement...")
    
    if dry_run:
        print("\n" + "⚠️" * 30)
        print("⚠️ MODE DRY-RUN ACTIVÉ : Aucune donnée n'a été insérée ou mise à jour.")
        if clear_table:
            print("⚠️ L'option --clear a été ignorée en mode dry-run.")
        print("⚠️" * 30 + "\n")
    else:
        if clear_table:
            print("🗑️ Vidage de la table quiz_questions en cours...")
            supabase.table("quiz_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print("✅ Table vidée.")
        
        # ✨ MODIFICATION ICI : Utilisation de upsert au lieu de insert
        for i in range(0, len(questions_to_insert), 100):
            batch = questions_to_insert[i:i+100]
            supabase.table("quiz_questions").upsert(
                batch, 
                on_conflict="band_id,question_type"
            ).execute()
            print(f"✅ Lot {i//100 + 1}/{(len(questions_to_insert)-1)//100 + 1} traité (inséré ou mis à jour).")

    print("\n" + "="*70)
    print("📊 STATISTIQUES DÉTAILLÉES")
    print("="*70)

    action_word = "SIMULÉE" if dry_run else "GÉNÉRÉE/MISE À JOUR"
    print(f"\n🔹 A. STATISTIQUES DE L'OPÉRATION {action_word}")
    print("-" * 70)
    
    print("📍 Par Pays :")
    for country, count in gen_q_by_country.most_common():
        print(f"   {country:<25} : {count:>3} questions | {count * 4:>3} réponses")
        
    print("\n🎸 Par Pilier :")
    for pillar, count in gen_q_by_pillar.most_common():
        print(f"   {pillar:<25} : {count:>3} questions | {count * 4:>3} réponses")

    print("\n🔹 B. STATISTIQUES GLOBALES ACTUELLES DE LA BASE DE DONNÉES")
    print("-" * 70)
    print("🔄 Récupération des données consolidées...")
    
    db_response = supabase.table("quiz_questions").select("pillar_id, bands(country)").execute()
    db_questions = db_response.data

    db_q_by_country = Counter()
    db_q_by_pillar = Counter()

    for q in db_questions:
        pillar = q.get("pillar_id", "Unknown")
        country = q.get("bands", {}).get("country", "Unknown") if q.get("bands") else "Unknown"
        db_q_by_country[country] += 1
        db_q_by_pillar[pillar] += 1

    print("\n📍 Total Questions/Réponses en DB par Pays :")
    for country, count in db_q_by_country.most_common():
        print(f"   {country:<25} : {count:>4} questions | {count * 4:>4} réponses")
        
    print("\n🎸 Total Questions/Réponses en DB par Pilier :")
    for pillar, count in db_q_by_pillar.most_common():
        print(f"   {pillar:<25} : {count:>4} questions | {count * 4:>4} réponses")

    print("\n" + "="*70)
    if dry_run:
        print("✅ Simulation terminée avec succès !")
    else:
        print("🎉 Traitement des questions de quiz terminé avec succès (zéro doublon créé) !")
    print("="*70 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Génère des questions de quiz MetalPedia depuis Supabase")
    parser.add_argument('--pillar', type=str, help="Filtrer par pilier (ex: 'Black Metal')")
    parser.add_argument('--country', type=str, help="Filtrer par pays (ex: 'Sweden')")
    parser.add_argument('--clear', action='store_true', help="Vider la table quiz_questions avant l'insertion")
    parser.add_argument('--dry-run', action='store_true', help="Mode test : simule sans modifier la DB")
    
    args = parser.parse_args()

    generate_quiz_questions(
        pillar_filter=args.pillar,
        country_filter=args.country,
        clear_table=args.clear,
        dry_run=args.dry_run
    )
