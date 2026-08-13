export const setAuthCookies = (res, accessToken, refreshToken) => {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  };
  res.cookie("accessToken", accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, {
    ...common,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};
