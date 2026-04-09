// ============================================================
// Portfolio Engine — Public API
// ============================================================

// Configuration
export { configurePortfolioEngine } from '../config.js'

// Events
export { EVENTS, on as onPortfolioEvent, emit } from '../events.js'

// Controllers
export { listPortfolio }       from '../controller/listPortfolio.controller.js'
export { getPortfolioItem }    from '../controller/getPortfolioItem.controller.js'
export { createItem }          from '../controller/createItem.controller.js'
export { updateItem }          from '../controller/updateItem.controller.js'
export { deleteItem }          from '../controller/deleteItem.controller.js'
export { addMedia }            from '../controller/addMedia.controller.js'
export { removeMedia }         from '../controller/removeMedia.controller.js'
export { manageTags }          from '../controller/manageTags.controller.js'

// Models (public contract shapes)
export { PortfolioItemModel }  from '../model/PortfolioItem.model.js'
export { PortfolioMediaModel } from '../model/PortfolioMedia.model.js'
export { BarberDetailsModel }     from '../model/BarberDetails.model.js'
export { LocksmithDetailsModel } from '../model/LocksmithDetails.model.js'
