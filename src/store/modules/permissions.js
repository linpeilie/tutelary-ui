import { SET_PERMISSIONS } from 'src/store/mutation-types'

import routes from 'src/router/routes'

export default {
  state: () => ({
    permissions: routes
  }),
  getters: {
    menus (state) {
      return state.permissions
    }
  },
  actions: {
    async getPermissions ({ commit }) {
      commit(SET_PERMISSIONS, [])
    }
  },
  mutations: {
    [SET_PERMISSIONS] (state, permissions) {
      state.permissions = permissions
    }
  }
}
