const navData = [
  {
    name: "Introduction",
    path: "/",
  },
  {
    name: "Headlines",
    path: "/headlines",
  },
  {
    name: "About",
    path: "/about",
  },
  {
    name: "Pricing & FAQs",
    // path: "/pricing&faqs",
    list: [
      {
        name: "Pricing",
        path: "/pricing",
      },
      {
        name: "FAQs",
        path: "/faqs",
      },
    ],
  },
];

export default navData;
