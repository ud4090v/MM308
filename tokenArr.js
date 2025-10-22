String.prototype.tokenArr = function(sfilter){

	let filters = sfilter || ['a','the','this', 'is','was','be','what','which','there','where','that','and','or','when','then','than'];

	let _tkn =  [... new Set(this.toLowerCase().split(/\W+/).filter(function(token) {
		return token.length > 1 && filters.indexOf(token) == -1;
	  }))]

	return _tkn;
}
