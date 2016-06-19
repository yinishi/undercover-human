app.directive('scoreboard', function (ScoreFactory) {
    return {
    	restrict: 'E',
    	templateUrl: '/templates/scores.html',
    	link: function(scope, element, attributes) {
    		scope.scores = ScoreFactory.scores;
    	}
    };
});