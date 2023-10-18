class APIUtils {
  constructor(query, queryString, excludedFields) {
    this.DEFAULT_PAGE = 1;
    this.DEFAULT_LIMIT = 100;
    this.DEFAULT_SORT = "-createdAt";
    this.DEFAULT_FIELDS = "-__v";
    this.SORTING_REGEX = /(gte|gt|lte|lt)\b/g;
    this.query = query;
    this.queryString = queryString;
    this.excludedFields = excludedFields;
  }

  filter() {
    const queryObj = { ...this.queryString };
    this.excludedFields.forEach((el) => delete queryObj[el]);

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      this.SORTING_REGEX,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.replace(",", " "));
    } else {
      this.query = this.query.sort(this.DEFAULT_SORT);
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(this.queryString.fields.replace(",", " "));
    } else {
      this.query = this.query.select(this.DEFAULT_FIELDS);
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || this.DEFAULT_PAGE;
    const limit = this.queryString.limit * 1 || this.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIUtils;
