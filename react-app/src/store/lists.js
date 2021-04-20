import * as pickActions from './picks'

const ADD_LISTS = 'lists/addLists'
// const ADD_LISTS_MEDIA = 'lists/addListsMedia'
const DELETE_LISTS = 'lists/deleteLists'
const SET_FRAME = 'lists/setFrame'
const SET_MEDIA_PICK = 'lists/setMediaPick'
const REMOVE_PICK = 'lists/removePick'

const addLists = lists => {
    return {
        type: ADD_LISTS,
        lists
    }
}

// const addListsMedia = lists => {
//     return {
//         type: ADD_LISTS_MEDIA,
//         lists
//     }
// }

const deleteLists = listIds => {
    return {
        type: DELETE_LISTS,
        listIds
    }
}

const setFrame = (frameName, frame) => {
    return {
        type: SET_FRAME,
        payload: {frameName, frame}
    }
}

export const setMediaPick = pick => {
    return {
        type: SET_MEDIA_PICK,
        pick
    }
}

export const removePick = pick => {
    return {
        type: REMOVE_PICK,
        pick
    }
}

export const runAddLists = (listIds/*, addMedia=false*/) => async dispatch => {
    // if (addMedia) dispatch(runAddListsMedia(listIds))
    const response = await fetch(`/api/lists/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ids: listIds,
            media: false,
        }),
    })
    const { lists } = await response.json()
    dispatch(addLists(lists))

    const picks = lists.reduce((picks, list) => {
        return picks.concat(list.picks)
    }, [])
    dispatch(pickActions.addPicks(picks))
}

// export const runAddListsMedia = listIds => async dispatch => {
//     const response = await fetch(`/api/lists/`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             ids: listIds,
//             media: true,
//         }),
//     })
//     const { lists_media } = await response.json()
//     dispatch(addListsMedia(lists_media))

//     const picks = lists_media.reduce((picks, list) => {
//         return picks.concat(list.picks)
//     }, [])
//     dispatch(pickActions.addPicksMedia(picks))
// }

export const runDeleteLists = listIds => async dispatch => {
    const response = await fetch(`/api/lists/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ids: listIds})
    })
    const deleted = await response.json()
    dispatch(deleteLists(listIds))
    return deleted
}

export const runSetFrame = (frameName, media=false, num=20) => async dispatch => {
    const response = await fetch(`/api/lists/${frameName}/${num}`, {
        headers: {
          'Content-Type': 'application/json',
        }
    })
    const frame = await response.json()
    dispatch(setFrame(frameName, frame))

    if (media) await dispatch(runAddLists(Object.keys(frame), true))
    else await dispatch(runAddLists(Object.keys(frame), false))
}

export const runNewList = (title, editorial) => async dispatch => {
    const response = await fetch(`/api/lists/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            editorial,
        })
    })
    const list = await response.json()
    dispatch(addLists([list]))
    return list
}

export const runEditList = (listId, title, editorial, published) => async dispatch => {
    const response = await fetch(`/api/lists/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            list_id: listId,
            title,
            editorial,
            published,
        })
    })
    const list = await response.json()
    dispatch(addLists([list]))
    return list
}

export const runSetMediaPick = (listId, day) => async dispatch => {
    const response = await fetch(`/api/picks/from_list`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            list_id: listId,
            date: day.obj,
        })
    })
    const { pick } = await response.json()
    if (pick) {
        console.log('   :::DAY:::   ', day);
        dispatch(setMediaPick(pick))
        dispatch(pickActions.addPicks([pick]))
    }
    return pick
}

const initialState = {
    all: {},
    // allMedia: {},
    next: {},
    my: {},
}

const listsReducer = (state = initialState, action) => {
    let newState
    let all
    let pick
    let pickId
    let listId
    let pickDate
    let pickDateSort
    switch (action.type) {
        case ADD_LISTS:
            newState = {...state}
            all = {...state.all}
            action.lists.forEach(list => {
                all[list.id] = list
            })
            newState.all = all
            return newState
        // case ADD_LISTS_MEDIA:
        //     newState = {...state}
        //     all = {...state.all}
        //     action.lists.forEach(list => {
        //         all[list.id] = list
        //     })
        //     newState.allMedia = all
        //     return newState
        case DELETE_LISTS:
            newState = {...state}
            all = {...state.all}
            action.listIds.forEach(listId => {
                delete all[listId]
            })
            newState.all = all
            return newState
        case SET_FRAME:
            newState = {...state}
            newState[action.payload.frameName] = action.payload.frame
            return newState
        case SET_MEDIA_PICK:
            newState = JSON.parse(JSON.stringify(state))
            pick = action.pick
            pickId = action.pick.id
            listId = action.pick.list_id
            pickDate = action.pick.date
            pickDateSort = action.pick.date_sort

            // set picks
            newState.all[listId].picks[pickId] = pick
            newState.all[listId].picks_by_date[pickDateSort] = pick

            // set new list dates if needed
            if (pickDateSort < newState.all[listId].end_date_sort) {
                newState.all[listId].start_date_sort = pickDateSort
                newState.all[listId].start_date = pickDate
            }
            if (pickDateSort > newState.all[listId].end_date_sort) {
                newState.all[listId].end_date_sort = pickDateSort
                newState.all[listId].end_date = pickDate
            }

            return newState
        case REMOVE_PICK:
            newState = JSON.parse(JSON.stringify(state))
            pick = action.pick
            pickId = action.pick.id
            listId = action.pick.list_id
            pickDate = action.pick.date
            pickDateSort = action.pick.date_sort

            // set picks

            delete newState.all[listId].picks[pickId]
            delete newState.all[listId].picks_by_date[pickDateSort]

            // set new list dates if needed
            const sortKeys = Object.keys(newState.all[listId].picks_by_date)
            if (pickDateSort < sortKeys[0]) {
                const newStartSort = sortKeys[0]
                const newStartDate = newState.all[listId].picks_by_date[newStartSort].date
                newState.all[listId].start_date_sort = newStartSort
                newState.all[listId].start_date = newStartDate
            }
            if (pickDateSort > sortKeys[sortKeys.length - 1]) {
                const newEndSort = sortKeys[sortKeys.length - 1]
                const newEndDate = newState.all[listId].picks_by_date[newEndSort].date
                newState.all[listId].end_date_sort = newEndSort
                newState.all[listId].end_date = newEndDate
            }

            return newState
        default:
            return state
    }
}


export default listsReducer
