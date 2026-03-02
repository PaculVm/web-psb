import api from "./api";

const authService = {
  login: async (credentials) => {
    const { data } = await api.post("/login", credentials);
    return data;
  },
};

export default authService;