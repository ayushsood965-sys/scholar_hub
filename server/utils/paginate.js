const paginate = (query, queryParams) => {
  const limit = parseInt(queryParams.limit) || 0;
  const skip = parseInt(queryParams.skip) || 0;
  if (skip) query = query.skip(skip);
  if (limit) query = query.limit(limit);
  return query;
};

module.exports = paginate;
