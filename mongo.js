let winPct;
async function main(){
  let client = require('mongodb').MongoClient;
  let url = "mongodb://localhost:27017/";
  //for user input
  const readline = require('readline');

  let conn = client.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function(err,db){
    let dbo = db.db("sports");
    await winPercantageOneTeam(dbo, "Cleveland Browns", function(){}, true);
    await winPercantageTwoTeams(dbo, "Houston Texans", "Jacksonville Jaguars", function(){}, true);
    await underOverOneTeam(dbo, "Miami Dolphins", function(){}, true);
    await underOverTwoTeams(dbo, "Miami Dolphins", "Buffalo Bills", function(){}, true);
    await spreadOneTeam(dbo, "Miami Dolphins", function(){}, true);
    await spreadTwoTeams(dbo, "Green Bay Packers", "Pittsburgh Steelers", function(){}, true);
    await findUnderOverNoTeams(dbo, 3, function(){}, true);
    await findUnderOverOneTeam(dbo, 50, "Buffalo Bills", function(){}, true);
    await findUnderOverTwoTeams(dbo, 50, "Buffalo Bills", "New England Patriots", function(){}, true);
    await pointDifferentialCompareNoTeams(dbo, 10, function(){}, true);
    await pointDifferentialCompareOneTeam(dbo, 10, "Buffalo Bills", function(){}, true);
    await pointDifferentialCompareTwoTeams(dbo, 10, "Buffalo Bills", "New England Patriots", function(){}, true);
    await pointDifferentialOneTeam(dbo, "Buffalo Bills", function(){}, true, 1990, 1993);
    await pointDifferentialTwoTeams(dbo, "Buffalo Bills", "New York Jets", function(){}, true);
    await whoWillWin(dbo, "Buffalo Bills", "Miami Dolphins", function(){}, true);
    db.close();
  });
}

async function winPercantageOneTeam(dbo, team, callback, log, earliest = 1979, latest = 2019){
  const collection = dbo.collection('ball');
  const justWins = (await collection.find({schedule_season: {$gte: earliest, $lte: latest},
                                          schedule_playoff: false,
                                          $or: [{team_home: team, $where: "this.score_home > this.score_away"},
                                                {team_away: team, $where: "this.score_away > this.score_home"}]
                                    }).toArray());
  const allGames =  (await collection.find({schedule_season: {$gte: earliest, $lte: latest},
                                          schedule_playoff: false,
                                          $or: [{team_home: team},
                                                {team_away: team}]
                                    }).toArray());
  let pct = (justWins.length / allGames.length) * 100;
  pct = Math.round(pct * 100) / 100;
  if(log)
    console.log("The " + team + " have won " + pct + "% of their regular season games between " + earliest + " and " + latest + "\n");
  callback();
}

//given two teams, which team will historically win the matchup
async function winPercantageTwoTeams(dbo, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const collection = dbo.collection('ball');
  const justWins = (await collection.find({schedule_season: {$gte: earliest, $lte: latest},
                                          schedule_playoff: false,
                                          $or: [{team_home: team1, team_away: team2, $where: "this.score_home > this.score_away"},
                                                {team_home: team2, team_away: team1, $where: "this.score_away > this.score_home"}]
                                    }).toArray());
  const allGames =  (await collection.find({schedule_season: {$gte: earliest, $lte: latest},
                                          schedule_playoff: false,
                                          $or: [{team_home: team1, team_away: team2},
                                                {team_home: team2, team_away: team1}]
                                    }).toArray());
  let pct = (justWins.length / allGames.length) * 100;
  winPct = pct;
  pct = Math.round(pct * 100) / 100;
  if(log)
    console.log("The " + team1 + " have won " + pct + "% of their regular season games against the " + team2 + " between " + earliest + " and " + latest + "\n");
  callback();
}

//given 1 team, will this team and their opponent's combined score match what the over-under predicts?
async function underOverOneTeam(dbo, team, callback, log, earliest = 1979, latest = 2019){
  const collection = dbo.collection('ball');
  const allGames = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team}, {team_away: team}]}).toArray());
  const over = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $where: "this.over_under_line < this.score_away + this.score_home"}).toArray());
  const under = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $where: "this.over_under_line > this.score_away + this.score_home"}).toArray());
  const push = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $where: "this.over_under_line === this.score_away + this.score_home"}).toArray());
  let overPct = (over.length / allGames.length) * 100;
  overPct = Math.round(overPct * 100) / 100;
  let underPct = (under.length / allGames.length) * 100;
  underPct = Math.round(underPct * 100) / 100;
  let pushPct = (push.length / allGames.length) * 100;
  pushPct = Math.round(pushPct * 100) / 100;
  if(log)
    console.log("Over-Under data for the " + team + " across all games between " + earliest +
              " and " + latest + ":\nOver: " + overPct + "%\nUnder: " + underPct + "%\nPush: " + pushPct + "%" + "\n");
  callback();
}

async function underOverTwoTeams(dbo, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const collection = dbo.collection('ball');
  const allGames = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}]}).toArray());
  const over = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                       $where: "this.over_under_line < this.score_away + this.score_home"}).toArray());
  const under = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                       $where: "this.over_under_line > this.score_away + this.score_home"}).toArray());
  const push = (await collection.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                       $where: "this.over_under_line === this.score_away + this.score_home"}).toArray());
  let overPct = (over.length / allGames.length) * 100;
  overPct = Math.round(overPct * 100) / 100;
  let underPct = (under.length / allGames.length) * 100;
  underPct = Math.round(underPct * 100) / 100;
  let pushPct = (push.length / allGames.length) * 100;
  pushPct = Math.round(pushPct * 100) / 100;
  if(log)
    console.log("Over-Under data for the " + team1 + " in games vs the " + team2 + " between " + earliest +
              " and " + latest + ":\nOver: " + overPct + "%\nUnder: " + underPct + "%\nPush: " + pushPct + "%" + "\n");
  callback();
}

async function spreadOneTeam(dbo, team, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const ids = dbo.collection('teamIds');

  const teamId = ((await ids.find({team_name: team}).toArray())[0].team_id);
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team}, {team_away: team}]}).toArray());
  const spreadCovered = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                                $or:[{team_home: team, team_favorite_id: teamId, $expr: {$gt: ["$score_home",  {$add: ["$score_away", "$spread_favorite"]}]} },
                                                     {team_away: team, team_favorite_id: teamId, $expr: {$gt: ["$score_away",  {$add: ["$score_home", "$spread_favorite"]}]} },
                                                     {team_home: team, team_favorite_id: {$ne: teamId}, $expr: {$gt: ["$score_home",  {$subtract: ["$score_away", "$spread_favorite"]}]} },
                                                     {team_away: team, team_favorite_id: {$ne: teamId}, $expr: {$gt: ["$score_away",  {$subtract: ["$score_away", "$spread_favorite"]}]} }]}).toArray());
  let spreadPct = (spreadCovered.length / allGames.length) * 100;
  spreadPct = Math.round(spreadPct * 100) / 100;
if(log)
    console.log("The " + team + " have covered the spread in " + spreadPct + "% of their games between " + earliest + " and " + latest + "\n");
  callback();
}

async function spreadTwoTeams(dbo, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const ids = dbo.collection('teamIds');

  const teamId = ((await ids.find({team_name: team1}).toArray())[0].team_id);
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}]}).toArray());
  const spreadCovered = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                                $or:[{team_home: team1, team_away: team2, team_favorite_id: teamId, $expr: {$gt: ["$score_home",  {$add: ["$score_away", "$spread_favorite"]}]} },
                                                     {team_away: team1, team_home: team2, team_favorite_id: teamId, $expr: {$gt: ["$score_away",  {$add: ["$score_home", "$spread_favorite"]}]} },
                                                     {team_home: team1, team_away: team2, team_favorite_id: {$ne: teamId}, $expr: {$lt: ["$score_home",  {$add: ["$score_away", "$spread_favorite"]}]} },
                                                     {team_away: team1, team_home: team2, team_favorite_id: {$ne: teamId}, $expr: {$lt: ["$score_away",  {$add: ["$score_away", "$spread_favorite"]}]} }]}).toArray());
  let spreadPct = (spreadCovered.length / allGames.length) * 100;
  spreadPct = Math.round(spreadPct * 100) / 100;
  if(log)
    console.log("The " + team1 + " have covered the spread in " + spreadPct + "% of their games vs the " + team2 + " between " + earliest + " and " + latest + "\n");
  callback();
}

async function findUnderOverNoTeams(dbo, underOver, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false}).toArray());
  const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$gt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$lt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$eq: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  let greaterPct = (greater.length / allGames.length) * 100;
  greaterPct = Math.round(greaterPct * 100) / 100;
  let lessPct = (less.length / allGames.length) * 100;
  lessPct = Math.round(lessPct * 100) / 100;
  let eqPct = (equal.length / allGames.length) * 100;
  eqPct = Math.round(eqPct * 100) / 100;
  if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games:\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function findUnderOverOneTeam(dbo, underOver, team, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team}, {team_away: team}]}).toArray());
  const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team}, {team_away: team}],
                                      $expr: {$gt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team}, {team_away: team}],
                                      $expr: {$lt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team}, {team_away: team}],
                                      $expr: {$eq: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  let greaterPct = (greater.length / allGames.length) * 100;
  greaterPct = Math.round(greaterPct * 100) / 100;
  let lessPct = (less.length / allGames.length) * 100;
  lessPct = Math.round(lessPct * 100) / 100;
  let eqPct = (equal.length / allGames.length) * 100;
  eqPct = Math.round(eqPct * 100) / 100;
  if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games with the " + team + ":\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function findUnderOverTwoTeams(dbo, underOver, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}]}).toArray());
  const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$gt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$lt: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$eq: [{$add: ["$score_home", "$score_away"]}, underOver]}}).toArray());
  let greaterPct = (greater.length / allGames.length) * 100;
  greaterPct = Math.round(greaterPct * 100) / 100;
  let lessPct = (less.length / allGames.length) * 100;
  lessPct = Math.round(lessPct * 100) / 100;
  let eqPct = (equal.length / allGames.length) * 100;
  eqPct = Math.round(eqPct * 100) / 100;
  if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games between the " + team1 + " and the " + team2 + ":\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function pointDifferentialCompareNoTeams(dbo, diff, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false}).toArray());
  const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$gt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$lt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $expr: {$eq: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  let greaterPct = (greater.length / allGames.length) * 100;
  greaterPct = Math.round(greaterPct * 100) / 100;
  let lessPct = (less.length / allGames.length) * 100;
  lessPct = Math.round(lessPct * 100) / 100;
  let eqPct = (equal.length / allGames.length) * 100;
  eqPct = Math.round(eqPct * 100) / 100;
  if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games:\n"
              + greaterPct + "% have had a point differential greater than " + diff +
              ",\n" + lessPct + "% have had a point differential less than " + diff +
              ", and\n" + eqPct + "% have had a point differential equal to " + diff + "\n");
   callback();
}

async function pointDifferentialCompareOneTeam(dbo, diff, team, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team}, {team_away: team}]}).toArray());
   const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $expr: {$gt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
   const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $expr: {$lt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
   const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                       $or: [{team_home: team}, {team_away: team}],
                                       $expr: {$eq: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
   let greaterPct = (greater.length / allGames.length) * 100;
   greaterPct = Math.round(greaterPct * 100) / 100;
   let lessPct = (less.length / allGames.length) * 100;
   lessPct = Math.round(lessPct * 100) / 100;
   let eqPct = (equal.length / allGames.length) * 100;
   eqPct = Math.round(eqPct * 100) / 100;
   if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games involving the " + team + ":\n"
               + greaterPct + "% have had a point differential greater than " + diff +
               ",\n" + lessPct + "% have had a point differential less than " + diff +
               ", and\n" + eqPct + "% have had a point differential equal to " + diff + "\n");
    callback();
}

async function pointDifferentialCompareTwoTeams(dbo, diff, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const allGames = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                           $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}]}).toArray());
  const greater = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$gt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  const less = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$lt: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  const equal = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      $or: [{team_home: team1, team_away: team2}, {team_away: team1, team_home: team2}],
                                      $expr: {$eq: [{ $abs: {$subtract: ["$score_home", "$score_away"]}}, diff]}}).toArray());
  let greaterPct = (greater.length / allGames.length) * 100;
  greaterPct = Math.round(greaterPct * 100) / 100;
  let lessPct = (less.length / allGames.length) * 100;
  lessPct = Math.round(lessPct * 100) / 100;
  let eqPct = (equal.length / allGames.length) * 100;
  eqPct = Math.round(eqPct * 100) / 100;
  if(log)
    console.log("Between " + earliest + " and " + latest + ", among regular season games between the " + team1 + " and the " + team2 + ":\n"
              + greaterPct + "% have had a point differential over " + diff +
              ",\n" + lessPct + "% have had a point differential under " + diff +
              ", and\n" + eqPct + "% have had a point differential equal to " + diff + "\n");
  callback();
}

async function pointDifferentialOneTeam(dbo, team, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const home = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_home: team}).toArray());
  const away = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_away: team}).toArray());
  for(let i = 0; i < home.length; i++){
    home[i] = home[i].score_home - home[i].score_away;
  }
  for(let i = 0; i < away.length; i++){
    away[i] = away[i].score_away - away[i].score_home;
  }
  const diff = home.reduce((acc,e) => acc+e) + away.reduce((acc,e) => acc+e);
  if(log)
    console.log("The " + team +"\'s overall point differential between " + earliest + " and " + latest + " is " + diff + "\n");
}

async function pointDifferentialTwoTeams(dbo, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  const home = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_home: team1, team_away: team2}).toArray());
  const away = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_away: team1, team_home: team2}).toArray());
  for(let i = 0; i < home.length; i++){
    home[i] = home[i].score_home - home[i].score_away;
  }
  for(let i = 0; i < away.length; i++){
    away[i] = away[i].score_away - away[i].score_home;
  }
  const diff = home.reduce((acc,e) => acc+e) + away.reduce((acc,e) => acc+e);
  if(log)
    console.log("The " + team1 +"\'s overall point differential against the " + team2 + " between " + earliest + " and " + latest + " is " + diff + "\n");
}

async function whoWillWin(dbo, team1, team2, callback, log, earliest = 1979, latest = 2019){
  const scores = dbo.collection('ball');
  await winPercantageTwoTeams(dbo, team1, team2, callback, false, earliest, latest, false);
  let adjustedWinPct = winPct;

  const home = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_home: team1, team_away: team2}).toArray());

  for(let i = 0; i < home.length; i++){
    home[i] = home[i].score_home - home[i].score_away;
  }

  const away = (await scores.find({schedule_season: {$gte: earliest, $lte: latest}, schedule_playoff: false,
                                      team_home: team2, team_away: team1}).toArray());

  for(let i = 0; i < away.length; i++){
    away[i] = away[i].score_away - away[i].score_home;
  }
  const totalPointDiff = home.reduce((acc, e)=> acc+e) + away.reduce((acc, e)=> acc+e);
  const weight = calcWeight(totalPointDiff);
  adjustedWinPct *= (1 + weight);
  adjustedWinPct = superSercretFormula(adjustedWinPct);
  if(log)
    console.log("The " + team1 + " have approximately a " + adjustedWinPct + "% chance of winning against the " + team2 + "\n");
  callback();
}





















function superSercretFormula(adjustedWinPct){
  let temp = Math.random() < Math.random() ? adjustedWinPct + Math.random()*2 : adjustedWinPct - Math.random()*2;
  if(temp <= 0) return 0.01;
  else if(temp >= 100) return 99.99;
  else return Math.round(temp*100) / 100;
}

function calcWeight(totalPointDiff){
  let weight;
  if(totalPointDiff > 500){
    weight = .10;
  }
  else if(totalPointDiff > 100){
    weight = .05;
  }
  else if(totalPointDiff > 50){
    weight = .025;
  }
  else if(totalPointDiff > 10){
    weight = .0125;
  }
  else if(totalPointDiff < 10 && totalPointDiff > -10){
    weight = 0;
  }
  else if(totalPointDiff < -10){
    weight = -.0125;
  }
  else if(totalPointDiff < -50){
    weight = -.025;
  }
  else if(totalPointDiff < -100){
    weight = -.05;
  }
  else if(totalPointDiff < -500){
    weight = -.10;
  }
  return weight;
}

main();
