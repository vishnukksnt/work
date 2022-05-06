angular.module('sntRover').filter('highlightWords', function() {
	return function(text, selectedWords) {
		return transformTextToHighlight(text, selectedWords);
	};
});

/**
 * Function to highlight the search words in the given text
 */
function transformTextToHighlight(text, replaceableStrings) {
	var regExpSpan = new RegExp("<span class='ui-match'>", "gi");
	var text = text.replace(regExpSpan, "");

	regExpSpan = new RegExp("</span>", "gi");
	text = text.replace(regExpSpan, "");
	var replacableString = text;
	var spanAddedIndex = [];
	var singleMatchFound = false;
	var singleMatchFoundIndex = 0;

	replaceableStrings.forEach(function(element, index, array) {
		var subString = "";
		var subStringArray = [];
		var indexToMatch = 0;
		var strSize = element.length;
		var charToMatch = element.charAt(0);
		var substringPos = [];
		var replacableStringArray = replacableString.split("");

		for (var idx = 0; idx < replacableStringArray.length; idx++) {
			char = replacableStringArray[idx];
			// replacableString.split("").forEach(function(char, idx) {
			var isAlreadyAdded = false;

			if (spanAddedIndex.length > 0) {
				spanAddedIndex.forEach(function(idxsAdded) {
					idxsAdded.forEach(function(idxAdded) {
						var startIdx = idxAdded[0];
						var endIdx = idxAdded[1];

						if (idx >= startIdx && idx <= endIdx) {
							isAlreadyAdded = true;
						}
					});

				});
			}
			if (isAlreadyAdded)
				continue;

			if (charToMatch.toLowerCase() == char.toLowerCase()) {
				if (!singleMatchFound)
					singleMatchFoundIndex = idx;
				singleMatchFound = true;
				subString += char;
				charToMatch = element.charAt(indexToMatch + 1);
				indexToMatch += 1;

				if (indexToMatch > 0 && (strSize == indexToMatch)) {
					singleMatchFound = false;
					substringPos.push(idx - strSize);
					subStringArray.push(subString);
				}
			} else {
				subString = "";
				charToMatch = element.charAt(0);
				indexToMatch = 0;
				if (singleMatchFound) {
					singleMatchFound = false;
					idx = singleMatchFoundIndex;
					singleMatchFoundIndex = 0;
					continue;
				}
			}
		}
		var splitedString = [];

		lastIdx = 0;
		spanAddedIndex[index] = [];
		substringPos.forEach(function(idx, position) {
			splitedString.push(replacableString.substring(lastIdx, idx + 1));
			var formatedString = "<span class='ui-match'>" + subStringArray[position] + "</span>";

			splitedString.push(formatedString);
			if (index > 0) {
				spanAddedIndex.forEach(function(spanIndex) {
					spanIndex.forEach(function(spanIdx) {
						if (idx + 1 < spanIdx[0]) {
							spanIdx[0] = spanIdx[0] + (formatedString.length - strSize);
							spanIdx[1] = spanIdx[1] + (formatedString.length - strSize);
						}
					});
				});
			}
			var padding = 0;

			padding = (spanAddedIndex[index].length) * (formatedString.length - strSize);

			spanAddedIndex[index].push([idx + 1 + padding, idx + formatedString.length + padding]);
			lastIdx = idx + strSize + 1;
		});
		splitedString.push(replacableString.substring(lastIdx, replacableString.length));
		replacableString = splitedString.join("");
	});
	return replacableString;
}