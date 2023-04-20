const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server listing to port http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndDb();

const convertPlayersDetailsIntoCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsIntoCamelCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//get players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            * 
        FROM 
            player_details 
        ORDER BY 
         player_id;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachItem) => convertPlayersDetailsIntoCamelCase(eachItem))
  );
});

//GET player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT * 
        FROM 
            player_details 
        WHERE 
            player_id = ${playerId}; 
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayersDetailsIntoCamelCase(player));
});

//Update player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details 
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};
    `;
  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Matches API
app.get("/matches/", async (request, response) => {
  const getMatchesQuery = `
        SELECT 
            * 
        FROM 
            match_details 
        ORDER BY 
         match_id;
    `;
  const matchesArray = await db.all(getMatchesQuery);
  response.send(
    matchesArray.map((eachItem) => convertMatchDetailsIntoCamelCase(eachItem))
  );
});

//Get Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT * 
        FROM 
            match_details 
        WHERE 
            match_id = ${matchId}; 
    `;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDetailsIntoCamelCase(matchDetails));
});

//Get Matches Played By player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchIdQuery = `
        SELECT 
            * 
        FROM 
            player_match_score NATURAL JOIN match_details
        WHERE 
            player_id = ${playerId};  
    `;
  const matchIdResponse = await db.all(getMatchIdQuery);
  response.send(
    matchIdResponse.map((eachItem) =>
      convertMatchDetailsIntoCamelCase(eachItem)
    )
  );
});

//Get list Of Player API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerWhoPlayedMatchesQuery = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName
        FROM 
              player_match_score NATURAL JOIN player_details 
        WHERE 
            match_id = ${matchId};
    `;
  const dbResponse = await db.all(getPlayerWhoPlayedMatchesQuery);
  response.send(dbResponse);
});

//Get Stats API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerTotalMatchQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
              player_match_score 
              INNER JOIN player_details ON player_details.player_id = player_match_score.player_id
        WHERE 
           player_details.player_id = ${playerId};
    `;
  const dbResponse = await db.get(getPlayerTotalMatchQuery);
  response.send(dbResponse);
});

module.exports = app;
