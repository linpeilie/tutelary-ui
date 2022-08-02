import _ from 'lodash'

export const formatDate = (date) => {
  if (!date) {
    return '-'
  }
  if (date < 60) {
    return date + 's'
  } else if (date < 3600) {
    const min = _.floor(_.divide(date, 60))
    return min + 'min ' + formatDate(date % 60)
  } else if (date < 86400) {
    const h = _.floor(_.divide(date, 3600))
    return h + 'h ' + formatDate(date % 3600)
  } else {
    const d = _.floor(_.divide(date, 86400))
    return d + 'd ' + formatDate(date % 86400)
  }
}
