import React, { useCallback, useEffect, useState } from 'react';
import { I18nManager, Linking, ScrollView, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Button as ButtonRNElements } from 'react-native-elements';

import Notifications from '../../blue_modules/notifications';
import { BlueCard, BlueLoading, BlueSpacing20, BlueText } from '../../BlueComponents';
import presentAlert from '../../components/Alert';
import { Button } from '../../components/Button';
import CopyToClipboardButton from '../../components/CopyToClipboardButton';
import ListItem from '../../components/ListItem';
import { BlueCurrentTheme, useTheme } from '../../components/themes';
import loc from '../../loc';

const NotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isShowTokenInfo, setShowTokenInfo] = useState(0);
  const [tokenInfo, setTokenInfo] = useState('<empty>');
  const [URI, setURI] = useState();

  const { colors } = useTheme();

  const onNotificationsSwitch = async value => {
    setNotificationsEnabled(value); // so the slider is not 'jumpy'
    if (value) {
      // user is ENABLING notifications
      await Notifications.cleanUserOptOutFlag();
      if (await Notifications.getPushToken()) {
        // we already have a token, so we just need to reenable ALL level on groundcontrol:
        await Notifications.setLevels(true);
      } else {
        // ok, we dont have a token. we need to try to obtain permissions, configure callbacks and save token locally:
        await Notifications.tryToObtainPermissions();
      }
    } else {
      // user is DISABLING notifications
      await Notifications.setLevels(false);
    }

    setNotificationsEnabled(await Notifications.isNotificationsEnabled());
  };

  useEffect(() => {
    (async () => {
      setNotificationsEnabled(await Notifications.isNotificationsEnabled());
      setURI(await Notifications.getSavedUri());
      setTokenInfo(
        'token: ' +
          JSON.stringify(await Notifications.getPushToken()) +
          ' permissions: ' +
          JSON.stringify(await Notifications.checkPermissions()) +
          ' stored notifications: ' +
          JSON.stringify(await Notifications.getStoredNotifications()),
      );
      setIsLoading(false);
    })();
  }, []);

  const stylesWithThemeHook = {
    root: {
      ...styles.root,
      backgroundColor: colors.background,
    },
    scroll: {
      ...styles.scroll,
      backgroundColor: colors.background,
    },
    scrollBody: {
      ...styles.scrollBody,
      backgroundColor: colors.background,
    },
  };

  const save = useCallback(async () => {
    setIsLoading(true);
    try {
      if (URI) {
        // validating only if its not empty. empty means use default
        if (await Notifications.isGroundControlUriValid(URI)) {
          await Notifications.saveUri(URI);
          presentAlert({ message: loc.settings.saved });
        } else {
          presentAlert({ message: loc.settings.not_a_valid_uri });
        }
      } else {
        await Notifications.saveUri('');
        presentAlert({ message: loc.settings.saved });
      }
    } catch (error) {
      console.warn(error);
    }
    setIsLoading(false);
  }, [URI]);

  return isLoading ? (
    <BlueLoading />
  ) : (
    <ScrollView style={stylesWithThemeHook.scroll} automaticallyAdjustContentInsets contentInsetAdjustmentBehavior="automatic">
      <ListItem
        Component={TouchableWithoutFeedback}
        title={loc.settings.push_notifications}
        switch={{ onValueChange: onNotificationsSwitch, value: isNotificationsEnabled, testID: 'NotificationsSwitch' }}
      />
      <BlueSpacing20 />

      <BlueCard>
        <BlueText>{loc.settings.groundcontrol_explanation}</BlueText>
      </BlueCard>

      <ButtonRNElements
        icon={{
          name: 'github',
          type: 'font-awesome',
          color: colors.foregroundColor,
        }}
        onPress={() => Linking.openURL('https://github.com/BlueWallet/GroundControl')}
        titleStyle={{ color: colors.buttonAlternativeTextColor }}
        title="github.com/BlueWallet/GroundControl"
        color={colors.buttonTextColor}
        buttonStyle={styles.buttonStyle}
      />

      <BlueCard>
        <View style={styles.uri}>
          <TextInput
            placeholder={Notifications.getDefaultUri()}
            value={URI}
            onChangeText={setURI}
            numberOfLines={1}
            style={styles.uriText}
            placeholderTextColor="#81868e"
            editable={!isLoading}
            textContentType="URL"
            autoCapitalize="none"
            underlineColorAndroid="transparent"
          />
        </View>

        <BlueSpacing20 />
        <BlueText style={styles.centered} onPress={() => setShowTokenInfo(isShowTokenInfo + 1)}>
          ♪ Ground Control to Major Tom ♪
        </BlueText>
        <BlueText style={styles.centered} onPress={() => setShowTokenInfo(isShowTokenInfo + 1)}>
          ♪ Commencing countdown, engines on ♪
        </BlueText>

        {isShowTokenInfo >= 9 && (
          <View>
            <CopyToClipboardButton stringToCopy={tokenInfo} displayText={tokenInfo} />
          </View>
        )}

        <BlueSpacing20 />
        <Button onPress={save} title={loc.settings.save} />
      </BlueCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  uri: {
    flexDirection: 'row',
    borderColor: BlueCurrentTheme.colors.formBorder,
    borderBottomColor: BlueCurrentTheme.colors.formBorder,
    borderWidth: 1,
    borderBottomWidth: 0.5,
    backgroundColor: BlueCurrentTheme.colors.inputBackgroundColor,
    minHeight: 44,
    height: 44,
    alignItems: 'center',
    borderRadius: 4,
  },
  centered: {
    textAlign: 'center',
  },
  uriText: {
    flex: 1,
    color: '#81868e',
    marginHorizontal: 8,
    minHeight: 36,
    height: 36,
  },
  buttonStyle: {
    backgroundColor: 'transparent',
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
});

export default NotificationSettings;
