var parseFormat = function(data) {
  return data.match(/Format:(.*)/)[1].replace(/\s/g, '').split(',');
};
