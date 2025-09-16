function UnknownOptionError() {
  return Error('Unknown option. Check the docs at mufunds.com/usage.html');
}

function EmptyAssetIdentifierError() {
  return Error('Asset identifier is empty.');
}

function UnknownSourceError() {
  return Error('Unknown data source. Check the docs at mufunds.com/usage.html');
}

function AssetNotFoundError() {
  return Error('Asset not found. Please use another identifier and/or data source.');
}

function DataNotAvailableError() {
  return Error('Requested data is not available for this asset from this data source. Please try a different source.');
}
