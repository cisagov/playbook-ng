import {
  ItemToTechMap,
  ItemToTechVal,
  TechToItemMap,
} from "../../dataset/types";

export const getItemToTechs = (techToItem: TechToItemMap): ItemToTechMap => {
  // map to fill
  const itemToTech: ItemToTechMap = {
    unmapped: {
      version: "",
      techs: [],
    },
  };

  // items living under 1+ techs
  Object.entries(techToItem).forEach(([techId, tiVal]) => {
    // unmapped Items processed later
    if (techId === "unmapped") {
      return;
    }

    const { confidence, items } = tiVal;

    const techEntry: ItemToTechVal["techs"][number] = {
      id: techId,
      confidence,
    };

    // techs without items are 'unmapped'
    if (items.length === 0) {
      itemToTech.unmapped.techs.push(techEntry);
    }

    // techs with items
    else {
      items.forEach((item) => {
        // item not added yet
        if (typeof itemToTech[item.id] === "undefined") {
          itemToTech[item.id] = {
            version: item.version,
            techs: [techEntry],
          };
        }

        // item already added
        else {
          itemToTech[item.id].techs.push(techEntry);
        }
      });
    }
  });

  // unmapped items
  // - can be entirely unmapped
  // - OR can be added here in addition to living under 1+ techs
  techToItem.unmapped.items.forEach((item) => {
    // item not added yet
    if (typeof itemToTech[item.id] === "undefined") {
      itemToTech[item.id] = {
        version: item.version,
        techs: [],
      };
    }
  });

  return itemToTech;
};
