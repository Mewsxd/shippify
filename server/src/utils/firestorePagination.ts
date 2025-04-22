import {
  Firestore,
  Query,
  DocumentData,
  DocumentSnapshot,
} from "firebase-admin/firestore";

interface PaginateOptions {
  collection: string;
  pageSize: number;
  orderBy?: string[];
  cursor?: string;
  where?: [string, FirebaseFirestore.WhereFilterOp, any][];
  fetchingUnassignedDeliveries?: boolean;
}

// export const paginateCollection = async (
//   db: Firestore,
//   options: PaginateOptions
// ) => {
//   const { collection, pageSize, orderBy, cursor, where = [] } = options;

//   let ref: Query<DocumentData> = db.collection(collection);
//   options.fetchingUnassignedDeliveries = !options.fetchingUnassignedDeliveries
//     ? false
//     : true;

//   if (where.length > 2 && options.fetchingUnassignedDeliveries) {
//     console.log("TINGOOOOOOO");

//     // console.log(where);
//     for (const [field, op, value] of where) {
//       ref = ref.where(field, op, value);
//     }
//     const snapshot = await ref.get();
//     const docs = snapshot.docs;
//     const hasNextPage = docs.length > pageSize;
//     const trimmedDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

//     const items = trimmedDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
//     const nextCursor = hasNextPage
//       ? trimmedDocs[trimmedDocs.length - 1].id
//       : null;

//     return { items, nextCursor, hasNextPage };
//   }

//   // Apply where conditions if provided
//   if (where.length > 0 && options.fetchingUnassignedDeliveries === false) {
//     console.log(where);
//     for (const [field, op, value] of where) {
//       ref = ref.where(field, op, value);
//     }
//     const snapshot = await ref.get();
//     const docs = snapshot.docs;
//     const hasNextPage = docs.length > pageSize;
//     const trimmedDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

//     const items = trimmedDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
//     const nextCursor = hasNextPage
//       ? trimmedDocs[trimmedDocs.length - 1].id
//       : null;

//     return { items, nextCursor, hasNextPage };
//   }

//   //@ts-ignore
//   if (options.fetchingUnassignedDeliveries) {
//     // console.log("RAAAAHHHHHHH");
//     console.log("WHERE on line 69", where);

//     //@ts-ignore
//     ref = ref.orderBy(orderBy[2]).orderBy(orderBy[0], orderBy[1]);
//   } else {
//     //@ts-ignore
//     ref = ref.orderBy(orderBy[0], orderBy[1]);
//   }
//   // console.log(orderBy);

//   ref = ref.limit(pageSize + 1);
//   if (cursor) {
//     //@ts-ignore

//     // ref = ref.orderBy(orderBy[0], orderBy[1]).limit(pageSize + 1);

//     const cursorDoc = await db.collection(collection).doc(cursor).get();
//     if (!cursorDoc.exists) throw new Error("Invalid cursor ID");
//     ref = ref.startAfter(cursorDoc);
//   }

//   const snapshot = await ref.get();
//   const docs = snapshot.docs;
//   const hasNextPage = docs.length > pageSize;
//   const trimmedDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

//   const items = trimmedDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
//   const nextCursor = hasNextPage
//     ? trimmedDocs[trimmedDocs.length - 1].id
//     : null;

//   return { items, nextCursor, hasNextPage };
// };

export const paginateCollection = async (
  db: Firestore,
  options: PaginateOptions
) => {
  const { collection, pageSize, orderBy, cursor, where = [] } = options;
  const fetchingUnassignedDeliveries =
    options.fetchingUnassignedDeliveries || false;
  // console.log("WHERE on line 69", where);
  // Start with the base collection reference
  let ref: Query<DocumentData> = db.collection(collection);

  // Apply all where conditions consistently
  for (const [field, op, value] of where) {
    ref = ref.where(field, op, value);
  }

  // Apply ordering in a consistent way
  if (
    fetchingUnassignedDeliveries &&
    Array.isArray(orderBy) &&
    orderBy.length >= 3
  ) {
    // For unassigned deliveries, we need to order by deliveryStatus first (when using !=)
    // then by the requested sort field
    //@ts-ignore
    ref = ref.orderBy(orderBy[2]).orderBy(orderBy[0], orderBy[1]);
  } else if (Array.isArray(orderBy) && orderBy.length >= 2) {
    //@ts-ignore
    ref = ref.orderBy(orderBy[0], orderBy[1]);
  }

  // Apply pagination
  ref = ref.limit(pageSize + 1);

  // Apply cursor if available
  if (cursor) {
    const cursorDoc = await db.collection(collection).doc(cursor).get();
    if (!cursorDoc.exists) throw new Error("Invalid cursor ID");
    ref = ref.startAfter(cursorDoc);
  }

  // Execute the query
  const snapshot = await ref.get();
  const docs = snapshot.docs;
  const hasNextPage = docs.length > pageSize;
  const trimmedDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

  const items = trimmedDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const nextCursor = hasNextPage
    ? trimmedDocs[trimmedDocs.length - 1].id
    : null;

  return { items, nextCursor, hasNextPage };
};
