import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const PREDEFINED_PLAYERS = {
  "No rizz no win": ["KG", "Abraham Hamik", "Fransig Haso", "Oraham David", "Aisn David", "Hana Warda", "Fady Haso", "Kristian Janan", "Rasmus Backman", "Nina Ishak", "Ihab", "No rizz no win", "Marcello Shabo", "Benjamin Yalda", "Viggo Vass", "Adam Larsson", "Albin Karlsson", "Hugo Andersson", "Leon Molina", "Sebastian Ljepoja"],
  "Lyon FC": ["Amel", "Leo Lif", "Fahad", "Tarik", "Ayoub Abassi", "Jean-loka", "Isam Abassi"],
  "Shadow Unit": ["Amanuel", "Yonatan", "Saimon", "Ayub", "David", "Abdullah", "Abdikarim"],
  "AKATSUKI CITY": ["Abika", "Turbo", "Abbe", "Ayub", "Lille Isse", "Yonis", "Omar", "Hamsa", "Hassan", "Erbek"],
  "FC Brexit": ["Rio", "Sebastian Romero", "Gardon", "Danilo", "Wickly", "Elijah", "Alexander Johnsson", "Omar Munir"],
  "FC Kurdistan": ["Herash", "Hemen", "Arko", "Rashid", "Ibrahim", "Farshid", "Omar", "Delle Poiyani", "Omed", "Aram"],
  "FC Stars": ["Mahdi Azizi", "Abbas Rajabi", "Rohullah", "Hadi Delawari", "Alireza Akrami", "Parwiz", "Mohammad Khoshdel", "Wahid", "Khalil Mohammadi", "Freidon Bahdori"],
  "BreezyC": ["André Roykiewicz", "Rodrigo Bernal", "Fabian Vitrera", "Nicholas Salazar", "Robin Zolfagary", "Christopher Pezoa Serey", "Jhon Jairo", "Esteban Munoz", "Leon Navarrete", "Cewin Eriksson"],
  "Muthos": ["Noah Damberg", "Matteus Eichoue", "Daniel Bakos", "Gabriel Bakos", "Adrian Issa", "Filip Fallström"],
  "FC Ohmslag": ["Ahmed Nejm", "Mustafa Nejm", "Danjel Ferdusi", "Osama Alsawi", "Hamza Hamza", "Bashir Bashir", "Mahmood Alzehhawi", "Rwi Elias", "Faisal Elias", "Fadi Aslo"],
  "Distinkt FC": ["Ivan Ammar", "Govand", "Abdi", "Yenga", "Kawa", "Ali"],
  "Joga Bonito": ["Kevin Berg", "Stefan Zivkovic", "Gustaf Rosengren", "Erwin Logo", "Benjamin Yakoub", "Leo Lopez", "Karl Netzell"],
  "Favela Allstars": ["Mahmoud Messaoudi", "Amani Biregey", "Eben Biregey", "Omar Trabelsi", "Ahmad Vafai"]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { cup_id } = await req.json();

    if (!cup_id) {
      return Response.json({ error: 'cup_id required' }, { status: 400 });
    }

    // Get cup and its teams
    const cup = await base44.asServiceRole.entities.Cup.get(cup_id);
    const participants = await base44.asServiceRole.entities.CupParticipant.filter({ 
      cup_id: cup_id,
      status: 'confirmed'
    });

    const teams = await Promise.all(
      participants
        .filter(p => p.team_id)
        .map(p => base44.asServiceRole.entities.Team.get(p.team_id))
    );

    let totalCreated = 0;
    const results = [];

    // For each team, check if there are predefined players
    for (const team of teams) {
      if (!team) continue;

      const teamPlayers = PREDEFINED_PLAYERS[team.name];
      if (!teamPlayers) {
        results.push({ team: team.name, status: 'no_predefined_players', created: 0 });
        continue;
      }

      // Check existing players
      const existingPlayers = await base44.asServiceRole.entities.CupPlayer.filter({
        cup_id: cup_id,
        team_id: team.id
      });

      const existingNames = new Set(existingPlayers.map(p => p.name));
      let created = 0;

      // Create players that don't exist
      for (const playerName of teamPlayers) {
        if (!existingNames.has(playerName)) {
          await base44.asServiceRole.entities.CupPlayer.create({
            cup_id: cup_id,
            team_id: team.id,
            name: playerName,
            goals: 0,
            assists: 0,
            is_fake_player: true
          });
          created++;
          totalCreated++;
        }
      }

      results.push({ 
        team: team.name, 
        status: 'success', 
        created: created,
        total: teamPlayers.length 
      });
    }

    return Response.json({
      success: true,
      total_created: totalCreated,
      results: results,
      message: `Skapade ${totalCreated} cup-spelare`
    });

  } catch (error) {
    console.error('Error seeding cup players:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});