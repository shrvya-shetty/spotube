import React from "react";
import { Button, ScrollArea, View } from "@nodegui/react-nodegui";
import { useHistory } from "react-router";
import { CursorShape, QMouseEvent } from "@nodegui/nodegui";
import { QueryCacheKeys } from "../conf";
import useSpotifyQuery from "../hooks/useSpotifyQuery";
import PlaceholderApplet from "./shared/PlaceholderApplet";
import PlaylistCard from "./shared/PlaylistCard";
import useSpotifyInfiniteQuery from "../hooks/useSpotifyInfiniteQuery";

function Home() {
  const { data: pagedCategories, isError, refetch, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useSpotifyInfiniteQuery<SpotifyApi.PagingObject<SpotifyApi.CategoryObject>>(
    QueryCacheKeys.categories,
    (spotifyApi, { pageParam }) => spotifyApi.getCategories({ country: "US", limit: 10, offset: pageParam }).then((categoriesReceived) => categoriesReceived.body.categories),
    {
      getNextPageParam(lastPage) {
        if (lastPage.next) {
          return lastPage.offset + lastPage.limit;
        }
      },
    }
  );

  const categories = pagedCategories?.pages
    .map((page) => page.items)
    .filter(Boolean)
    .flat(1);

  return (
    <ScrollArea style={`flex-grow: 1; border: none;`}>
      <View style={`flex-direction: 'column'; align-items: 'center'; flex: 1;`}>
        <PlaceholderApplet error={isError} message="Failed to query genres" reload={refetch} helps loading={isLoading} />
        {categories?.map((category, index) => {
          return <CategoryCard key={index + category.id} id={category.id} name={category.name} />;
        })}
        {hasNextPage &&
          <Button
            on={{ clicked: () => fetchNextPage() }}
            text="Load More"
            enabled={!isFetchingNextPage}
          />}
      </View>
    </ScrollArea>
  );
}

export default Home;

interface CategoryCardProps {
  id: string;
  name: string;
}

const categoryStylesheet = `
     #container{
       flex: 1;
       flex-direction: 'column';
       justify-content: 'center';
     }
     #anchor-heading{
       background: transparent;
       padding: 10px;
       border: none;
       outline: none;
       font-size: 20px;
       font-weight: bold;
       align-self: flex-start;
     }
     #child-view{
        flex: 1;
      }
     #anchor-heading:hover{
       border: none;
       outline: none;
       text-decoration: underline;
     }
  `;
const CategoryCard = ({ id, name }: CategoryCardProps) => {
  const history = useHistory();
  const { data: playlists, isError } = useSpotifyQuery<SpotifyApi.PlaylistObjectSimplified[]>(
    [QueryCacheKeys.categoryPlaylists, id],
    (spotifyApi) => spotifyApi.getPlaylistsForCategory(id, { limit: 4 }).then((playlistsRes) => playlistsRes.body.playlists.items),
    { initialData: [] }
  );

  function goToGenre(native: any) {
    const mouse = new QMouseEvent(native);
    if (mouse.button() === 1) {
      history.push(`/genre/playlists/${id}`, { name });
    }
  }
  if (isError) {
    return <></>;
  }
  return (
    <View id="container" styleSheet={categoryStylesheet}>
      <Button id="anchor-heading" cursor={CursorShape.PointingHandCursor} on={{ MouseButtonRelease: goToGenre }} text={name} />
      <View id="child-view">
        {playlists?.map((playlist, index) => {
          return <PlaylistCard key={index + playlist.id} playlist={playlist} />;
        })}
      </View>
    </View>
  );
};