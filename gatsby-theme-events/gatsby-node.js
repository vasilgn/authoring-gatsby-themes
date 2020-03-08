const fs = require("fs");

// 1. ensure 'data' dir
exports.onPreBootstrap = ({ reporter }) => {
  const contentPath = "data";

  if (!fs.existsSync(contentPath)) {
    reporter.info(`creating the ${contentPath} directory`);
    fs.mkdirSync(contentPath);
  }

  // 2. define eventType
  exports.sourceNodes = ({ actions }) => {
    actions.createTypes(`
  type Event implements Node @dontInfer {
    id: ID!
    name: String!
    location: String!
    startDate: Date! @dateformat @proxy(from: "start_date")
    endDate: Date! @dateformat @proxy(from: "end_date")
    url: String!
    slug: String!
  }`);
  };
  // 3. define resolver for custom fields
  exports.createResolvers = ({ createResolvers }) => {
    const basePath = "/";

    const slugify = str => {
      const slug = str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      return `/${basepath}/${slug}`.replace(/\/\/+/g, "/");
    };

    createResolvers({
      Event: {
        slug: {
          resolver: source => slugify(source.name)
        }
      }
    });
  };

  // 4. Query from events and create pages
  exports.createPages = async ({ actions, graphql, reporter }) => {
    const basePath = "/";

    actions.createPage({
      path: basePath,
      component: require.resolve("./src/templates/events.js")
    });

    const result = await graphql(`
      query {
        allEvent(sort: { fields: startDate, order: ASC }) {
          nodes {
            id
            slug
          }
        }
      }
    `);

    if (result.error) {
      reporter.panic("error loading events", reporter.errors);
      return;
    }
    const events = result.data.allEvent.nodes;

    events.forEach(event => {
      const { slug } = event;
      console.log(slug);
      actions.createPage({
        path: slug,
        component: require.resolve("./src/templates/event.js"),
        context: {
          eventID: event.id
        }
      });
    });
  };
};
