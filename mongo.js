const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});
async function main(){
  let client = require('mongodb').MongoClient;
  let url = "mongodb://localhost:27017/";
  //for user input
  const readline = require('readline');

  let conn = client.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function(err,db){
    let dbo = db.db("sports");
    await winPercantageOneTeam(dbo, "Cleveland Browns", function(){});
    await winPercantageTwoTeams(dbo, "Houstan Texans", "St. Louis Cardinals", function(){});
    await underOverOneTeam(dbo, "Miami Dolphins", function(){});
    await underOverTwoTeams(dbo, "Miami Dolphins", "Buffalo Bills", function(){});
    await spreadOneTeam(dbo, "Miami Dolphins", function(){});
    await spreadTwoTeams(dbo, "Green Bay Packers", "Pittsburgh Steelers", function(){}, 1979, 2019);
    await findUnderOverNoTeams(dbo, 3, function(){});
    await findUnderOverOneTeam(dbo, 50, "Buffalo Bills", function(){});
    await findUnderOverTwoTeams(dbo, 50, "Buffalo Bills", "New England Patriots", function(){});
    await findDifferenceNoTeams(dbo, 10, function(){});
    await findDifferenceOneTeam(dbo, 10, "Buffalo Bills", function(){});
    await findDifferenceTwoTeams(dbo, 10, "Buffalo Bills", "New England Patriots", function(){});
    db.close();
  });
}

async function winPercantageOneTeam(dbo, team, callback, earliest = 1979, latest = 2019){
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
  console.log("The " + team + " have won " + pct + "% of their regular season games between " + earliest + " and " + latest + "\n");
  callback();
}

//given two teams, which team will historically win the matchup
async function winPercantageTwoTeams(dbo, team1, team2, callback, earliest = 1979, latest = 2019){
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
  pct = Math.round(pct * 100) / 100;
  console.log("The " + team1 + " have won " + pct + "% of their regular season games against the " + team2 + " between " + earliest + " and " + latest + "\n");
  callback();
}

//given 1 team, will this team and their opponent's combined score match what the over-under predicts?
async function underOverOneTeam(dbo, team, callback, earliest = 1979, latest = 2019){
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
  console.log("Over-Under data for the " + team + " across all games between " + earliest +
              " and " + latest + ":\nOver: " + overPct + "%\nUnder: " + underPct + "%\nPush: " + pushPct + "%" + "\n");
  callback();
}

async function underOverTwoTeams(dbo, team1, team2, callback, earliest = 1979, latest = 2019){
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
  console.log("Over-Under data for the " + team1 + " in games vs the " + team2 + " between " + earliest +
              " and " + latest + ":\nOver: " + overPct + "%\nUnder: " + underPct + "%\nPush: " + pushPct + "%" + "\n");
  callback();
}

async function spreadOneTeam(dbo, team, callback, earliest = 1979, latest = 2019){
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
  console.log("The " + team + " have covered the spread in " + spreadPct + "% of their games between " + earliest + " and " + latest + "\n");
  callback();
}

async function spreadTwoTeams(dbo, team1, team2, callback, earliest = 1979, latest = 2019){
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
  console.log("The " + team1 + " have covered the spread in " + spreadPct + "% of their games vs the " + team2 + " between " + earliest + " and " + latest + "\n");
  callback();
}

async function findUnderOverNoTeams(dbo, underOver, callback, earliest = 1979, latest = 2019){
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
  console.log("Between " + earliest + " and " + latest + ", among regular season games:\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function findUnderOverOneTeam(dbo, underOver, team, callback, earliest = 1979, latest = 2019){
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
  console.log("Between " + earliest + " and " + latest + ", among regular season games with the " + team + ":\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function findUnderOverTwoTeams(dbo, underOver, team1, team2, callback, earliest = 1979, latest = 2019){
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
  console.log("Between " + earliest + " and " + latest + ", among regular season games between the " + team1 + " and the " + team2 + ":\n"
              + greaterPct + "% have had a combined score over " + underOver +
              ",\n" + lessPct + "% have had a combined score under " + underOver +
              ", and\n" + eqPct + "% have had a combined score equal to " + underOver + "\n");
  callback();

}

async function findDifferenceNoTeams(dbo, diff, callback, earliest = 1979, latest = 2019){
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
  console.log("Between " + earliest + " and " + latest + ", among regular season games:\n"
              + greaterPct + "% have had a score difference greater than " + diff +
              ",\n" + lessPct + "% have had a score difference less than " + diff +
              ", and\n" + eqPct + "% have had a score difference equal to " + diff + "\n");
   callback();
}

async function findDifferenceOneTeam(dbo, diff, team, callback, earliest = 1979, latest = 2019){
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
   console.log("Between " + earliest + " and " + latest + ", among regular season games involving the " + team + ":\n"
               + greaterPct + "% have had a score difference greater than " + diff +
               ",\n" + lessPct + "% have had a score difference less than " + diff +
               ", and\n" + eqPct + "% have had a score difference equal to " + diff + "\n");
    callback();
}

async function findDifferenceTwoTeams(dbo, diff, team1, team2, callback, earliest = 1979, latest = 2019){
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
  console.log("Between " + earliest + " and " + latest + ", among regular season games between the " + team1 + " and the " + team2 + ":\n"
              + greaterPct + "% have had a score difference over " + diff +
              ",\n" + lessPct + "% have had a score difference under " + diff +
              ", and\n" + eqPct + "% have had a score difference equal to " + diff + "\n");
  callback();
}

async function whoWillWin(dbo, team1, team2, callback, earliest = 1979, latest = 2019){
  //lines of code to load relevant information
  //  ...
  //  ...

  //lines of code to use that information to calculate a weighted probability that one team will win over the other
  //  ...
  //  ...
  //  ...
  callback();
}
main();
