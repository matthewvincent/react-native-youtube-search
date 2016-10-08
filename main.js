import Exponent, { Components } from 'exponent';
import { Ionicons } from '@exponent/vector-icons';
import React from 'react';
import _ from 'underscore';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import TimeAgo from 'react-native-timeago';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  WebView,
  StatusBar,
  LayoutAnimation,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  ListView
} from 'react-native';

var width = Dimensions.get('window').width; 

class App extends React.Component {
  constructor () {
    super();
    // function to compage ListView rows
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    // initial state
    this.state = {
      videos: null,
      modalVisible: false,
      searchHistory: [],
      ds: ds,
      queryOrder: 'relevance'
    }
  }
  // initial data fetch
  componentDidMount () {
    this.getVideos('react native')
  }
  // trigger animation on update
  componentWillUpdate () {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }
  // toggle search modal
  setModalVisible () {
    this.setState({
      modalVisible: !this.state.modalVisible
    });
  }
  // gets data from youtube search api based on string query
  // takes an options object and a callback 
  searchYoutube(options, cb) {
    const { 
      max, 
      query, 
      key, 
      resetToken 
    } = options;

    const nextPage = resetToken 
      ? "" 
      : "pageToken=" + this.state.nextPageToken + "&";
    
    const url = "https://www.googleapis.com/youtube/v3/search?"
      + nextPage
      + "part=snippet"
      + "&maxResults=" + max
      + "&type=video"
      + "&videoSyndicated=true"
      + "&order=" + this.state.queryOrder
      + "&q=" + query
      + "&key=" + key;
      + "&part=snippet,statistics"
      + "&fields=items(id,snippet,statistics)"

    fetch(url)
      .then(r => r.json()).then(j => cb(j)).catch(e => console.log(e));
  }

  getVideos (searchString) {
    // function to pass to searchYoutube
    // used for initial fetch of new search 
    function setVideoState(data) {
      var videos = data.items;
      // remove old videos from dom 
      // to initialize animation
      this.setState({
        videos:null,
        oldVideos: videos,
      });
      // then set state with our new data
      // save our current search and the 
      // token for next page of results
      setTimeout(() => {
        this.setState({
          modalVisible: false,
          videos: this.state.ds.cloneWithRows(videos),
          searchHistory: _.uniq(this.state.searchHistory.concat(searchString)),
          searchString: searchString,
          nextPageToken: data.nextPageToken
        });
      }, 0)
    }
    // call searchYoutube with a new searchString
    // re-set next page token to the second page
    this.searchYoutube({
      query: searchString,
      max: 25,
      key: "AIzaSyCcWlWyGp0wiAWldkCxCkhMVMrymb1dCqY",
      resetToken: true
    }, setVideoState.bind(this))
  }

  getNextPage() {
    // callback function for searchYoutube
    // get next page from search api
    function addVideos(data) {
      const newVideos = data.items;
      const next = data.nextPageToken;
      const updatedOld = this.state.oldVideos.concat(newVideos);

      this.setState({
        nextPageToken: next,
        oldVideos: updatedOld,
        videos: this.state.ds.cloneWithRows(updatedOld)
      });
    }
    // call searchYoutube with previous searchString
    // keep current nextPage token
    this.searchYoutube({
      query: this.state.searchString,
      max: 25,
      key: "AIzaSyCcWlWyGp0wiAWldkCxCkhMVMrymb1dCqY",
      resetToken: false
    }, addVideos.bind(this));
  }

  render() {
    
    if (this.state.videos) {
      return (
        <Components.LinearGradient
          colors={['#C8DADA','#F5B6B1','#C8DADA']}
          style={styles.container}
        > 

          <StatusBar barStyle="default" />
          <Header />
       
          <SearchModal 
            modalVisible={this.state.modalVisible}
            searchHistory={this.state.searchHistory}
            setModalVisible={this.setModalVisible.bind(this)}
            getVideos={this.getVideos.bind(this)}
          />

          <Browser 
            videos={this.state.videos} 
            getVideos={this.getVideos.bind(this)}
            setModalVisible={this.setModalVisible.bind(this)}
            getNextPage={this.getNextPage.bind(this)}
          />    

        </Components.LinearGradient>
      );
    } else { return  <LoadScreen /> } 
  }
}

// search history, search bar, close search button
const SearchModal = ({
  modalVisible, 
  searchHistory, 
  setModalVisible, 
  getVideos
}) => (
  <Modal
    animationType={"slide"}
    transparent={false}
    visible={modalVisible}
    onRequestClose={() => {alert("Modal has been closed.")}}
  >
    <CloseSearchButton setModalVisible={setModalVisible} />
    <View style={{marginTop: 22, flex: 1}}>   
      <SearchBar getVideos={getVideos} />
      <Text style={{marginLeft: 10, marginTop: 20}}>
        Recent:
      </Text>      
      <SearchHistory 
        searchHistory={searchHistory}
        getVideos={getVideos} 
      />      
    </View>
  </Modal>
);

const SearchHistory = ({searchHistory, getVideos}) => (
  <View style={styles.historyContainer}>
    <ScrollView>
      {searchHistory.map((search, i) => (
        <TouchableOpacity 
          key={i} 
          onPress={() => getVideos(search)}
        >
          <View style={styles.searchHistoryItem}>
            <Text style={styles.searchItemText}> 
              {search} 
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const CloseSearchButton = ({setModalVisible}) => (
  <TouchableOpacity 
    style={styles.closeSearchButton}
    onPress={() => {setModalVisible()}}
  >
    <View 
      shadowOpacity={.5}
      shadowColor='black'
      shadowRadius={8}
      shadowOffset={{height: 5, width: 0}}
      style={styles.iconWrapper}
    >
      <Ionicons 
        name="ios-close" 
        size={62} 
        style={styles.closeSearchIcon}
      />
    </View>
  </TouchableOpacity>
);

const Header = () => (
  <TouchableOpacity
    style={{flex: 1, maxHeight: 80}}
    onPress={() => { _scrollView.scrollTo({y: 0}); }}
  >  
    <Components.BlurView 
      tintEffect="light" 
      style={styles.header}
    >
      <Text style={styles.headerText}>
        Recast.ly
      </Text>
    </Components.BlurView>
  </TouchableOpacity>
);

// home page video browser
const Browser = ({
  videos, 
  getVideos, 
  setModalVisible, 
  getNextPage
}) => (
  <View style={{flex: 1}}>
    <SearchButton 
      setModalVisible={setModalVisible} 
    />
    <ListView
      ref={(scrollView) => { _scrollView = scrollView; }}
      renderRow={(data) => <Video video={data} /> }
      style={styles.videoList}
      dataSource={videos}
      onEndReachedThreashold={4000}
      onEndReached={getNextPage}
    />
  </View>
);

const SearchButton = ({setModalVisible}) => (
  <TouchableOpacity 
    style={styles.searchButton}
    onPress={() => {setModalVisible()}}
  >
    <View 
      shadowOpacity={.5}
      shadowColor='black'
      shadowRadius={8}
      shadowOffset={{height: 5, width: 0}}
      style={styles.iconWrapper}
    >
      <Ionicons 
        name="ios-search" 
        size={42} 
        style={styles.searchIcon}
      />
    </View>
  </TouchableOpacity>
);

const SearchBar = ({getVideos}) => (
  <TextInput 
    style={styles.searchInput}
    placeholder={"Search YouTube..."} 
    placeholderTextColor='rgba(0,0,0,.3)'
    returnKeyType={'search'}
    clearButtonMode={'while-editing'}
    keyboardAppearance={'default'}
    onSubmitEditing={event => getVideos(event.nativeEvent.text)}
  />
);

const Video = ({video}) => (
  <Components.BlurView 
    tintEffect="light" 
    style={styles.videoWrapper}
  >
    <Timestamp video={video} />
    <WebView
      source={{uri: 'https://www.youtube.com/embed/' + video.id.videoId}}
      style={styles.video}
      mediaPlaybackRequiresUserAction={false}
    />
    <Text style={styles.descriptionText}>
      {video.snippet.description || "No description..."}
    </Text>
  </Components.BlurView>
);

const Timestamp = ({video}) => (
  <View style={styles.timeStampWrapper}>
    <Ionicons 
      name="ios-time" 
      size={18}
      style={{marginRight: 8}} 
    />
    <TimeAgo time={video.snippet.publishedAt} />
  </View>
);

const LoadScreen = () => (
  <Components.LinearGradient
    colors={['#F5B6B1','#C8DADA']} 
    style={styles.loading}
  >
    <ActivityIndicator
      animating={true}
      style={{height: 80}}
      size="large"
    />
  </Components.LinearGradient>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoList: {
    flex: 1
  },
  video: {
    maxHeight: 220,
    flex: 1,
    marginTop: 10
  },
  searchInput: {
    marginTop: 10,
    height: 50,
    maxHeight: 50,
    padding: 5,
    paddingLeft:20,
    borderRadius: 25,
    color: 'rgba(0,0,0,.8)',
    borderColor: 'rgba(0,0,0,.2)',
    backgroundColor: 'rgba(0,0,0,.05)',
    borderWidth: .5,
    flex: 1,
    margin: 10
  },
  videoWrapper: {
    flex: 1,
    paddingBottom: 10,
    paddingTop: 10,
    minHeight: 400,
    backgroundColor: 'white',
    marginBottom: .5,
    justifyContent: 'space-around'
  },
  timeStampWrapper: {
    flex: 1, 
    flexDirection: 'row', 
    maxHeight: 20, 
    marginBottom: 10, 
    margin: 10
  },
  descriptionText: { 
    margin: 10,
    color: 'rgba(0,0,0,.8)'
  },
  loading: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingMessage: {
    color: 'white',
    fontSize: 40
  },
  header: {
    maxHeight: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: .5
  },
  headerText: {
    color: 'rgba(0,0,0,.8)',
    fontSize: 20,
    marginTop: 10
  },
  button: {
    flex: 1,
    height: 40
  },
  searchButton: {
    flex: 1,
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#8EA59F',
    position: 'absolute',
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  searchIcon: {
    color: 'rgba(0,0,0,.8)', 
    marginTop: 19, 
    marginLeft: 24, 
    backgroundColor:'transparent'
  },
  iconWrapper: {
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    flex: 1
  },
  closeSearchButton: {
    flex: 1,
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#e42f14',
    position: 'absolute',
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  closeSearchIcon: {
    color: 'white', 
    flex: 1,
    marginTop: 10,
    marginLeft: 28,
    backgroundColor:'transparent'
  },
  historyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.05)',
    margin: 10,
    borderRadius: 2,
    borderWidth: .5,
    borderColor: 'rgba(0,0,0,.2)'

  },
  searchHistoryItem: {
    backgroundColor:'white', 
    padding: 20, 
    alignItems: 'stretch', 
    justifyContent:'center', 
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 2,
    borderWidth: .5,
    borderColor: 'rgba(0,0,0,.2)'
  },
  searchItemText: {
    width: width - 80, 
    flex: 1, 
    textAlign: 'center'
  }
});

Exponent.registerRootComponent(App);
