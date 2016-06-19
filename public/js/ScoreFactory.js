app.factory('ScoreFactory', function() {
	var scoreFac = {};

	scoreFac.scores = {
		correctGuesses: 0,
		fooledPartner: 0,
		fooledByPartner: 0,
		totalScore: 0
	};

	return scoreFac;

});