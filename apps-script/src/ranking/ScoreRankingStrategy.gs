/** Classifica scores por score, frequência e número da dezena. */
class ScoreRankingStrategy extends IRankingStrategy {
  rank(scoreResults) {
    return scoreResults.slice()
      .sort((first, second) => second.score - first.score || second.frequency - first.frequency || first.number - second.number)
      .map((scoreResult, index) => new RankingResult(
        scoreResult.number,
        index + 1,
        scoreResult.score,
        scoreResult.frequency
      ));
  }
}
