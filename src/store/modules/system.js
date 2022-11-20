export default {
  state: () => ({
    miniSideBar: true,
    sideBarWidth: 300,
    miniSideBarWidth: 60
  }),
  getters: {
    miniSideBar (state) {
      return state.miniSideBar
    },
    sideBarWidth (state) {
      return state.sideBarWidth
    },
    miniSideBarWidth (state) {
      return state.miniSideBarWidth
    }
  },
  actions: {
    changeMiniSideBar({ commit }) {
      commit('CHANGE_MINI_SIDEBAR')
    }
  },
  mutations: {
    ['CHANGE_MINI_SIDEBAR'] (state) {
      state.miniSideBar = !state.miniSideBar
    }
  }
}
