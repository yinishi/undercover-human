app.factory('ScoreFactory', function() {
	var scoreFac = {};

	scoreFac.scores = {
		correctGuesses: 0,
		fooledPartner: 0,
		fooledByPartner: 0
	};

	scoreFac.getTotalScore = function() {
		return scoreFac.scores.correctGuesses + scoreFac.scores.fooledPartner * 2 - scoreFac.scores.fooledByPartner;
	};

	return scoreFac;

});