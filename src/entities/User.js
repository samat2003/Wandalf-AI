export const User = {
  me: async () => {
    return {
      full_name: "Samat",
      email: "samat@example.com",
      avatar_url: null,
    };
  },
  loginWithRedirect: async (redirectUrl) => {
    console.log("Mock login to:", redirectUrl);
    return Promise.resolve();
  },
  logout: async () => {
    console.log("Mock logout");
    return Promise.resolve();
  },
};
