import {
  addSimpleImagePostHandler,
  bulkSaveItemsHandler,
  collectionItemsInfiniteHandler,
  deleteUserCollectionHandler,
  followHandler,
  getAllCollectionsInfiniteHandler,
  getAllUserCollectionsHandler,
  getCollectionByIdHandler,
  getUserCollectionItemsByItemHandler,
  saveItemHandler,
  unfollowHandler,
  updateCollectionItemsStatusHandler,
  upsertCollectionHandler,
} from '~/server/controllers/collection.controller';
import { dbRead } from '~/server/db/client';
import { applyUserPreferences } from '~/server/middleware.trpc';
import { getByIdSchema } from '~/server/schema/base.schema';
import {
  addSimpleImagePostInput,
  bulkSaveCollectionItemsInput,
  followCollectionInputSchema,
  getAllCollectionItemsSchema,
  getAllCollectionsInfiniteSchema,
  getAllUserCollectionsInputSchema,
  getUserCollectionItemsByItemSchema,
  saveCollectionItemInputSchema,
  updateCollectionItemsStatusInput,
  upsertCollectionInput,
} from '~/server/schema/collection.schema';
import {
  isFlagProtected,
  middleware,
  protectedProcedure,
  publicProcedure,
  router,
} from '~/server/trpc';
import { throwAuthorizationError } from '~/server/utils/errorHandling';

const isOwnerOrModerator = middleware(async ({ ctx, next, input = {} }) => {
  if (!ctx.user) throw throwAuthorizationError();

  const { id } = input as { id: number };

  const userId = ctx.user.id;
  let ownerId = userId;
  if (id) {
    const isModerator = ctx?.user?.isModerator;
    ownerId = (await dbRead.collection.findUnique({ where: { id } }))?.userId ?? 0;
    if (!isModerator) {
      if (ownerId !== userId) throw throwAuthorizationError();
    }
  }

  return next({
    ctx: {
      // infers the `user` as non-nullable
      user: ctx.user,
      ownerId,
    },
  });
});

export const collectionRouter = router({
  getInfinite: protectedProcedure
    .input(getAllCollectionsInfiniteSchema)
    .use(isFlagProtected('profileCollections'))
    .use(applyUserPreferences())
    .query(getAllCollectionsInfiniteHandler),
  getAllUser: protectedProcedure
    .input(getAllUserCollectionsInputSchema)
    .use(isFlagProtected('collections'))
    .query(getAllUserCollectionsHandler),
  getById: publicProcedure
    .input(getByIdSchema)
    .use(isFlagProtected('collections'))
    .query(getCollectionByIdHandler),
  upsert: protectedProcedure.input(upsertCollectionInput).mutation(upsertCollectionHandler),
  saveItem: protectedProcedure
    .input(saveCollectionItemInputSchema)
    .use(isFlagProtected('collections'))
    .mutation(saveItemHandler),
  follow: protectedProcedure
    .input(followCollectionInputSchema)
    .use(isFlagProtected('collections'))
    .mutation(followHandler),
  unfollow: protectedProcedure
    .input(followCollectionInputSchema)
    .use(isFlagProtected('collections'))
    .mutation(unfollowHandler),
  getUserCollectionItemsByItem: protectedProcedure
    .input(getUserCollectionItemsByItemSchema)
    .use(isFlagProtected('collections'))
    .query(getUserCollectionItemsByItemHandler),
  getAllCollectionItems: protectedProcedure
    .input(getAllCollectionItemsSchema)
    .use(isFlagProtected('collections'))
    .query(collectionItemsInfiniteHandler),
  updateCollectionItemsStatus: protectedProcedure
    .input(updateCollectionItemsStatusInput)
    .use(isFlagProtected('collections'))
    .mutation(updateCollectionItemsStatusHandler),
  delete: protectedProcedure
    .input(getByIdSchema)
    .use(isFlagProtected('collections'))
    .use(isOwnerOrModerator)
    .mutation(deleteUserCollectionHandler),
  bulkSaveItems: protectedProcedure
    .input(bulkSaveCollectionItemsInput)
    .use(isFlagProtected('collections'))
    .mutation(bulkSaveItemsHandler),
  addSimpleImagePost: protectedProcedure
    .input(addSimpleImagePostInput)
    .use(isFlagProtected('collections'))
    .mutation(addSimpleImagePostHandler),
});
