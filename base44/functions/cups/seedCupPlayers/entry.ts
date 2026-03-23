import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const FUTSAL_FIESTA_PLAYERS = {
  "KG": [
    "Abraham Hamik", "Fransig Haso", "Oraham David", "Aisn David", "Hana Warda",
    "Fady Haso", "Kristian Janan", "Rasmus Backman", "Nina Ishak", "Ihab"
  ],
  "No rizz no win": [
    "Marcello Shabo", "Benjamin Yalda", "Viggo Vass", "Adam Larsson", "Albin Karlsson",
    "Hugo Andersson", "Leon Molina", "Sebastian Ljepoja"
  ],
  "Lyon FC": [
    "Amel", "Leo Lif", "Fahad", "Tarik", "Ayoub Abassi", "Jean-loka", "Isam Abassi"
  ],
  "Shadow Unit": [
    "Amanuel", "Yonatan", "Saimon", "Ayub", "David", "Abdullah", "Abdikarim"
  ],
  "AKATSUKI CITY": [
    "Abika", "Turbo", "Abbe", "Ayub", "Lille Isse", "Yonis", "Omar", "Hamsa", "Hassan", "Erbek"
  ],
  "FC Brexit": [
    "Rio", "Sebastian Romero", "Gardon", "Danilo", "Wickly", "Elijah", "Alexander Johnsson", "Omar Munir"
  ],
  "FC Kurdistan": [
    "Herash", "Hemen", "Arko", "Rashid", "Ibrahim", "Farshid", "Omar", "Delle Poiyani", "Omed", "Aram"
  ],
  "FC Stars": [
    "Mahdi Azizi", "Abbas Rajabi", "Rohullah", "Hadi Delawari", "Alireza Akrami",
    "Parwiz", "Mohammad Khoshdel", "Wahid", "Khalil Mohammadi", "Freidon Bahdori"
  ],
  "BreezyC": [
    "André Roykiewicz", "Rodrigo Bernal", "Fabian Vitrera", "Nicholas Salazar", "Robin Zolfagary",
    "Christopher Pezoa Serey", "Jhon Jairo", "Esteban Munoz", "Leon Navarrete", "Cewin Eriksson"
  ],
  "Muthos": [
    "Noah Damberg", "Matteus Eichoue", "Daniel Bakos", "Gabriel Bakos", "Adrian Issa", "Filip Fallström"
  ],
  "FC Ohmslag": [
    "Ahmed Nejm", "Mustafa Nejm", "Danjel Ferdusi", "Osama Alsawi", "Hamza Hamza",
    "Bashir Bashir", "Mahmood Alzehhawi", "Rwi Elias", "Faisal Elias", "Fadi Aslo"
  ],
  "Distinkt FC": [
    "Ivan Ammar", "Govand", "Abdi", "Yenga", "Kawa", "Ali"
  ],
  "Joga Bonito": [
    "Kevin Berg", "Stefan Zivkovic", "Gustaf Rosengren", "Erwin Logo", "Benjamin Yakoub",
    "Leo Lopez", "Karl Netzell"
  ],
  "Favela Allstars": [
    "Mahmoud Messaoudi", "Amani Biregey", "Eben Biregey", "Omar Trabelsi", "Ahmad Vafai"
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'cup_id required' }, { status: 400 });
    }

    // Get all cup teams
    const participants = await base44.asServiceRole.entities.CupParticipant.filter({
      cup_id: cup_id,
      status: 'confirmed'
    });

    let created = 0;
    let skipped = 0;

    for (const participant of participants) {
      if (!participant.team_id) continue;

      const team = await base44.asServiceRole.entities.Team.get(participant.team_id);
      const teamName = team.name;

      if (!FUTSAL_FIESTA_PLAYERS[teamName]) {
        console.log(`No players defined for team: ${teamName}`);
        continue;
      }

      // Check if players already exist
      const existingPlayers = await base44.asServiceRole.entities.CupPlayer.filter({
        cup_id: cup_id,
        team_id: team.id
      });

      if (existingPlayers.length > 0) {
        skipped += existingPlayers.length;
        continue;
      }

      // Create players
      const players = FUTSAL_FIESTA_PLAYERS[teamName];
      for (const playerName of players) {
        await base44.asServiceRole.entities.CupPlayer.create({
          cup_id: cup_id,
          team_id: team.id,
          name: playerName,
          goals: 0,
          assists: 0,
          matches_played: 0
        });
        created++;
      }
    }

    return Response.json({
      success: true,
      created,
      skipped,
      message: `Skapade ${created} spelare, hoppade över ${skipped} befintliga`
    });

  } catch (error) {
    console.error('Error seeding players:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});