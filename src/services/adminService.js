import api from "./api";

const adminService = {

  getStats: async () => {
    const { data } = await api.get("/admin/stats");
    return data;
  },

  getStudents: async () => {
    const { data } = await api.get("/admin/students");
    return data;
  },

  getPending: async () => {
    const { data } = await api.get("/admin/students?status=pending");
    return data;
  },

  verify: async (id, status) => {
    await api.put("/pendaftaran/verify", { id, status });
  }

};

export default adminService;